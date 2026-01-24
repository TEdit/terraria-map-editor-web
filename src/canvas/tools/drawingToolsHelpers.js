/**
 * Shared helpers for pencil and eraser tools
 * Both tools use identical pixel calculation algorithms
 * They differ only in the operation performed (apply color vs clear)
 */

import Main from "../main.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

import { drawLine, fillEllipseCentered, fillRectangleCentered, deduplicateTiles } from "../../utils/geometry/index.js";
import { isInSelection } from "../../utils/selection.js";

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

        // Apply the tool-specific operation
        if (tileOperationFn && tilesArray.length > 0) {
            await tileOperationFn(tilesArray, Main.state.optionbar.layer);
        }

        store.dispatch(stateChange(["status", "loading"], false));
    } catch (error) {
        console.error("Error in drawing tool click:", error);
        store.dispatch(stateChange(["status", "loading"], false));
    }
}

/**
 * Generic drag handler for drawing tools
 * Handles line interpolation and continuous stamping
 */
export async function onDrawingToolDrag(
    tileOperationFn  // Function to apply pixels: (tilesArray, layer) => Promise
) {
    try {
        // Validate required state exists
        if (!Main.state?.optionbar || !Main.state?.canvas) {
            console.warn("Drawing tool missing required state");
            return;
        }

        if (!Main.listeners.dragging)
            Main.listeners.dragging = true;

        store.dispatch(stateChange(["status", "loading"], true));

        // Interpolate line between previous and current position
        const linePoints = drawLine(
            {x: Main.listeners.drawingStartX, y: Main.listeners.drawingStartY},
            {x: Main.mousePosImageX, y: Main.mousePosImageY}
        );

        // Update start position for NEXT drag immediately (before async operation)
        // This prevents race conditions with rapid drag events
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

        // Apply the tool-specific operation (only if tiles exist)
        if (tileOperationFn && tilesArray.length > 0) {
            await tileOperationFn(tilesArray, Main.state.optionbar.layer);
        }

        store.dispatch(stateChange(["status", "loading"], false));
    } catch (error) {
        console.error("Error in drawing tool drag:", error);
        store.dispatch(stateChange(["status", "loading"], false));
    }
}

/**
 * Generic up handler for drawing tools
 */
export function onDrawingToolUp(_e) {
    Main.listeners.dragging = false;
    // Reset drawing start position so next stroke starts fresh
    Main.listeners.drawingStartX = undefined;
    Main.listeners.drawingStartY = undefined;
    // Clear stroke buffer for next stroke
    Main.listeners.strokeBuffer = null;
}
