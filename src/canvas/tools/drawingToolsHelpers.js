/**
 * Shared helpers for pencil and eraser tools
 * Both tools use identical pixel calculation algorithms
 * They differ only in the operation performed (apply color vs clear)
 *
 * Performance optimizations:
 * - Request coalescing: Batches multiple drag events before sending to worker
 * - Render batching: Uses requestAnimationFrame to render at most 60fps
 * - Optimistic rendering: Renders immediately, confirms with worker data
 */

import Main from "../main.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

import { drawLine, fillEllipseCentered, fillRectangleCentered, deduplicateTiles } from "../../utils/geometry/index.js";
import { isInSelection } from "../../utils/selection.js";
import { renderOptimistic } from "../../utils/colorApplication.js";
import LAYERS from "../../utils/dbs/LAYERS.js";
import { finalizeUndo } from "../workerInterfaces/main/undo.js";

/**
 * Calculate dirty rectangle (bounding box) from tiles array
 * This allows putImageData to only copy the changed region instead of entire canvas
 */
function calculateDirtyRect(tilesArray) {
    if (!tilesArray || tilesArray.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    tilesArray.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };
}

/**
 * Performance tuning constants
 */
const PERF_CONFIG = {
    // Batch worker requests: accumulate tiles for this many ms before sending to worker
    WORKER_BATCH_DELAY: 16,  // ~60fps (16ms), increase to 32-50ms for heavier batching

    // Render throttling: render at most once per this many ms
    RENDER_THROTTLE: 16,  // ~60fps, increase to 32ms for 30fps

    // Max tiles per worker batch (prevent sending huge arrays)
    MAX_BATCH_SIZE: 10000
};

/**
 * Batch state for accumulating tile changes during drag
 */
const batchState = {
    pendingTiles: new Map(),  // Map of "x,y" -> tile coordinates
    batchTimer: null,
    renderTimer: null,
    lastRenderTime: 0,
    workerBusy: false,  // Is worker currently processing a batch?
    needsFlush: false,  // Do we need to flush again after current operation?
    // Dirty rectangle tracking (for optimized putImageData)
    dirtyMinX: Infinity,
    dirtyMinY: Infinity,
    dirtyMaxX: -Infinity,
    dirtyMaxY: -Infinity
};

/**
 * Get brush tiles based on shape and size
 * Used by both pencil and eraser
 */
export function getBrushTiles(center, size, shape) {
    const [width, height] = Array.isArray(size) ? size : [size, size];

    if (shape === "circle" || shape === "ellipse") {
        return fillEllipseCentered(
            center,
            {x: Math.floor(width/2), y: Math.floor(height/2)}
        ).map(p => [p.x, p.y]);
    } else {
        // Default: square/rectangle
        return fillRectangleCentered(
            center,
            {x: width, y: height}
        ).map(p => [p.x, p.y]);
    }
}

/**
 * Get filtered tile array for drawing operation
 * Applies bounds checking and selection filtering
 */
export function getFilteredTiles(tilesArray, maxTilesX, maxTilesY) {
    // Filter out of bounds
    tilesArray = tilesArray.filter(([x, y]) => x >= 0 && y >= 0 && x < maxTilesX && y < maxTilesY);

    // Filter to respect selection if active
    tilesArray = tilesArray.filter(([x, y]) =>
        isInSelection(x, y, Main.state.selection)
    );

    return tilesArray;
}

/**
 * Flush pending tile batch to worker
 * Only allows one worker operation at a time to prevent flooding
 */
async function flushBatch(tileOperationFn, layer) {
    if (batchState.pendingTiles.size === 0) {
        return;
    }

    // If worker is busy, mark that we need to flush again and return
    if (batchState.workerBusy) {
        batchState.needsFlush = true;
        return;
    }

    // Extract tiles from map
    const tilesArray = Array.from(batchState.pendingTiles.values());
    batchState.pendingTiles.clear();

    // Clear batch timer since we're flushing
    if (batchState.batchTimer) {
        clearTimeout(batchState.batchTimer);
        batchState.batchTimer = null;
    }

    // Mark worker as busy
    batchState.workerBusy = true;
    batchState.needsFlush = false;

    // Execute the operation
    try {
        await tileOperationFn(tilesArray, layer);
    } catch (error) {
        console.error("Batch flush error:", error);
    } finally {
        // Mark worker as free
        batchState.workerBusy = false;

        // If more tiles accumulated while we were processing, flush again
        if (batchState.needsFlush || batchState.pendingTiles.size > 0) {
            batchState.needsFlush = false;
            // Schedule next flush (don't block)
            setTimeout(() => flushBatch(tileOperationFn, layer), 0);
        }
    }
}

/**
 * Schedule a batched render using requestAnimationFrame
 */
function scheduleRender(renderFn) {
    // Cancel any pending render
    if (batchState.renderTimer) {
        cancelAnimationFrame(batchState.renderTimer);
    }

    // Schedule new render
    batchState.renderTimer = requestAnimationFrame(() => {
        const now = performance.now();
        const timeSinceLastRender = now - batchState.lastRenderTime;

        // Throttle to prevent over-rendering
        if (timeSinceLastRender >= PERF_CONFIG.RENDER_THROTTLE) {
            renderFn();
            batchState.lastRenderTime = now;
            batchState.renderTimer = null;
        } else {
            // Too soon, schedule for later
            batchState.renderTimer = requestAnimationFrame(() => {
                renderFn();
                batchState.lastRenderTime = performance.now();
                batchState.renderTimer = null;
            });
        }
    });
}

/**
 * Generic click handler for drawing tools
 * Handles initial brush stamp at click position
 */
export async function onDrawingToolClick(
    tileOperationFn  // Function to apply pixels: (tilesArray, layer) => Promise
) {
    try {
        if (Main.listeners.dragging) {
            Main.listeners.dragging = false;
            return;
        }

        // Validate required state exists
        if (!Main.state?.optionbar || !Main.state?.canvas) {
            console.warn("Drawing tool missing required state");
            return;
        }

        // Store starting position for next drag (line interpolation)
        Main.listeners.drawingStartX = Main.mousePosImageX ?? 0;
        Main.listeners.drawingStartY = Main.mousePosImageY ?? 0;

        // Initialize stroke buffer to track painted tiles across the entire stroke
        Main.listeners.strokeBuffer = new Set();

        // Clear any pending batches from previous operations
        batchState.pendingTiles.clear();
        if (batchState.batchTimer) {
            clearTimeout(batchState.batchTimer);
            batchState.batchTimer = null;
        }

        store.dispatch(stateChange(["status", "loading"], true));

        const shape = Main.state.optionbar.brushShape || "square";
        let tilesArray = getBrushTiles(
            {x: Main.mousePosImageX, y: Main.mousePosImageY},
            Main.state.optionbar.size,
            shape
        );

        const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

        tilesArray = getFilteredTiles(tilesArray, maxTilesX, maxTilesY);

        // Add tiles to stroke buffer to prevent re-painting
        tilesArray.forEach(([x, y]) => {
            Main.listeners.strokeBuffer.add(`${x},${y}`);
        });

        // Apply the tool-specific operation immediately (no batching for click)
        if (tileOperationFn && tilesArray.length > 0) {
            await tileOperationFn(tilesArray, Main.state.optionbar.layer);
            finalizeUndo().catch(() => {});
        }

        store.dispatch(stateChange(["status", "loading"], false));
    } catch (error) {
        console.error("Error in drawing tool click:", error);
        store.dispatch(stateChange(["status", "loading"], false));
    }
}

/**
 * Generic drag handler for drawing tools - PERFORMANCE OPTIMIZED
 * Batches tile changes and renders using requestAnimationFrame
 */
export async function onDrawingToolDrag(
    tileOperationFn,  // Function to apply pixels: (tilesArray, layer) => Promise
    tileEditOptions = null  // Override for optimistic rendering (null = use Main.state.optionbar.tileEditOptions)
) {
    try {
        // Validate required state exists
        if (!Main.state?.optionbar || !Main.state?.canvas) {
            console.warn("Drawing tool missing required state");
            return;
        }

        if (!Main.listeners.dragging) {
            Main.listeners.dragging = true;
            store.dispatch(stateChange(["status", "loading"], true));
        }

        // Interpolate line between previous and current position
        const linePoints = drawLine(
            {x: Main.listeners.drawingStartX, y: Main.listeners.drawingStartY},
            {x: Main.mousePosImageX, y: Main.mousePosImageY}
        );

        // Update start position for NEXT drag immediately (before async operation)
        Main.listeners.drawingStartX = Main.mousePosImageX;
        Main.listeners.drawingStartY = Main.mousePosImageY;

        // Build tile array by stamping brush at each line point
        let tilesArray = [];
        const shape = Main.state.optionbar.brushShape || "square";
        const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

        linePoints.forEach(point => {
            const brushTiles = getBrushTiles(point, Main.state.optionbar.size, shape);
            tilesArray.push(...brushTiles);
        });

        // Deduplicate to prevent double-painting within this drag event
        tilesArray = deduplicateTiles(tilesArray);
        tilesArray = getFilteredTiles(tilesArray, maxTilesX, maxTilesY);

        // Filter out tiles that were already painted in this stroke
        const strokeBuffer = Main.listeners.strokeBuffer || new Set();
        tilesArray = tilesArray.filter(([x, y]) => {
            const key = `${x},${y}`;
            return !strokeBuffer.has(key);
        });

        // Add newly painted tiles to stroke buffer
        tilesArray.forEach(([x, y]) => {
            strokeBuffer.add(`${x},${y}`);
        });

        if (tilesArray.length === 0) return;

        // OPTIMISTIC RENDERING: Render immediately for instant visual feedback
        const layer = Main.state.optionbar.layer;
        const optimisticOptions = tileEditOptions || Main.state.optionbar.tileEditOptions;
        renderOptimistic(tilesArray, layer, maxTilesX, maxTilesY, optimisticOptions);

        // Calculate dirty rectangle for this render (only copy changed pixels to canvas)
        const dirtyRect = calculateDirtyRect(tilesArray);
        Main.updateLayers(layer, dirtyRect);

        // Update paint layer optimistically if needed
        let paintLayerUpdated = false;
        if (optimisticOptions) {
            const opts = optimisticOptions;
            const isTiles = layer === LAYERS.TILES;
            const isWalls = layer === LAYERS.WALLS;
            const paintId = isTiles ? opts.blockColor : isWalls ? opts.wallColor : null;
            const paintEnabled = isTiles ? opts.editBlockColor : isWalls ? opts.editWallColor : false;

            if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
                const paintLayer = isTiles ? LAYERS.TILEPAINT : LAYERS.WALLPAINT;
                Main.updateLayers(paintLayer, dirtyRect);
                paintLayerUpdated = true;
            }
        }
        // PERFORMANCE OPTIMIZATION: Add tiles to pending batch for worker confirmation
        tilesArray.forEach(([x, y]) => {
            const key = `${x},${y}`;
            batchState.pendingTiles.set(key, [x, y]);

            // Track dirty rectangle bounds
            batchState.dirtyMinX = Math.min(batchState.dirtyMinX, x);
            batchState.dirtyMinY = Math.min(batchState.dirtyMinY, y);
            batchState.dirtyMaxX = Math.max(batchState.dirtyMaxX, x);
            batchState.dirtyMaxY = Math.max(batchState.dirtyMaxY, y);
        });

        // If batch is getting too large, flush immediately
        if (batchState.pendingTiles.size >= PERF_CONFIG.MAX_BATCH_SIZE) {
            // Don't await - let it run in background (optimistic render already done!)
            flushBatch(tileOperationFn, layer);
        } else {
            // Schedule batch flush
            if (batchState.batchTimer) {
                clearTimeout(batchState.batchTimer);
            }
            batchState.batchTimer = setTimeout(() => {
                flushBatch(tileOperationFn, layer);
            }, PERF_CONFIG.WORKER_BATCH_DELAY);
        }

    } catch (error) {
        console.error("Error in drawing tool drag:", error);
    }
}

/**
 * Generic up handler for drawing tools - PERFORMANCE OPTIMIZED
 * Flushes any pending batches
 */
export async function onDrawingToolUp(_e, tileOperationFn, layer) {
    Main.listeners.dragging = false;

    // Clear batch timer
    if (batchState.batchTimer) {
        clearTimeout(batchState.batchTimer);
        batchState.batchTimer = null;
    }

    // Wait for any in-flight worker operation to complete
    if (batchState.workerBusy) {
        while (batchState.workerBusy) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }

    // Flush any remaining pending tiles
    if (tileOperationFn && layer !== undefined) {
        await flushBatch(tileOperationFn, layer);
    }

    // Finalize undo group for the entire stroke
    finalizeUndo().catch(() => {});

    // Clear render timer
    if (batchState.renderTimer) {
        cancelAnimationFrame(batchState.renderTimer);
        batchState.renderTimer = null;
    }

    // Reset drawing start position so next stroke starts fresh
    Main.listeners.drawingStartX = undefined;
    Main.listeners.drawingStartY = undefined;

    // Clear stroke buffer for next stroke
    Main.listeners.strokeBuffer = null;

    // Clear loading state
    store.dispatch(stateChange(["status", "loading"], false));
}

/**
 * Export performance config for tuning
 */
export { PERF_CONFIG, calculateDirtyRect };
