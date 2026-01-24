/**
 * Unified rendering pipeline for tile editing tools
 *
 * Architecture (Phase 2 - Data First, Memory Efficient, Optimistic Rendering):
 * 1. Tool renders IMMEDIATELY with expected values (optimistic)
 * 2. Tool sends to worker in batched request
 * 3. Worker confirms changes and returns actual tile data
 * 4. Tool re-renders from worker data to verify (usually matches optimistic)
 *
 * This ensures:
 * - INSTANT visual feedback (no lag from batching/worker)
 * - Data consistency (worker is source of truth)
 * - Memory efficiency (tiles stay in worker)
 * - Smooth 60fps drawing (batched worker calls)
 *
 * Used by: pencil, brush, eraser, and bucket fill tools
 *
 * Rendering handled by shared tileRenderer.js:
 * - getTileColor(): Base tile/wall/liquid rendering
 * - getPaintColor(): Paint layer rendering with blending
 * - Special tiles: Rainbow brick (ID 160), Checkerboard (ID 51)
 */

import Main from "../canvas/main.js";
import LAYERS from "./dbs/LAYERS.js";
import { getTileColor, getPaintColor } from "./rendering/tileRenderer.js";

/**
 * Build optimistic tile object from operation parameters
 * Used for instant rendering before worker confirms
 */
function buildOptimisticTile(layer, newId, tileEditOptions) {
    const tile = {};

    if (newId === "delete") {
        // Eraser - empty tile
        return tile;
    }

    // Apply the new ID based on layer
    switch (layer) {
        case LAYERS.TILES:
            tile.blockId = parseInt(newId);
            break;
        case LAYERS.WALLS:
            tile.wallId = parseInt(newId);
            break;
        case LAYERS.LIQUIDS:
            tile.liquidType = newId;
            tile.liquidAmount = 255;
            break;
        case LAYERS.WIRES:
            tile["wire" + newId.charAt(0).toUpperCase() + newId.slice(1)] = true;
            break;
    }

    // Apply paint if specified in options
    if (tileEditOptions) {
        if (tileEditOptions.editBlockColor && tileEditOptions.blockColor) {
            tile.blockColor = parseInt(tileEditOptions.blockColor);
        }
        if (tileEditOptions.editWallColor && tileEditOptions.wallColor) {
            tile.wallColor = parseInt(tileEditOptions.wallColor);
        }
        if (tileEditOptions.editSlope && tileEditOptions.slope) {
            tile.slope = tileEditOptions.slope;
        }
        // Add other tileEditOptions properties as needed
    }

    return tile;
}

/**
 * Render tiles from tile data
 *
 * This is the unified pipeline function used by all editing tools.
 * Tiles are kept in worker to save memory - tools pass tile data from worker response.
 *
 * @param {Array<[number, number]>} tilesArray - Array of [x, y] coordinates to render
 * @param {number} layer - LAYERS enum value
 * @param {number} maxTilesX - World width in tiles
 * @param {number} maxTilesY - World height in tiles
 * @param {Object} [tilesData] - Optional map of {x,y} -> tile object from worker.
 *                                If not provided, reads from Main.state.canvas.worldObject.tiles (full render only)
 */
export function renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData = null) {
    // Validation checks
    if (!tilesArray || !Array.isArray(tilesArray) || tilesArray.length === 0) {
        return;
    }

    if (!Main.layersImages?.[layer]?.data) {
        console.warn("Layer image data missing for rendering");
        return;
    }

    // Filter out of bounds tiles
    tilesArray = tilesArray.filter(([x, y]) =>
        x >= 0 && y >= 0 && x < maxTilesX && y < maxTilesY
    );

    if (tilesArray.length === 0) {
        return;
    }

    // Build lookup function for tiles
    const getTile = tilesData
        ? (x, y) => tilesData[`${x},${y}`] || {}
        : (x, y) => Main.state?.canvas?.worldObject?.tiles?.[x]?.[y] || {};

    // Render base layer from tile data
    tilesArray.forEach(([x, y]) => {
        const tile = getTile(x, y);

        const color = getTileColor(tile, layer, undefined, x, y, null);

        const offset = (maxTilesX * y + x) * 4;
        Main.layersImages[layer].data[offset] = color.r;
        Main.layersImages[layer].data[offset + 1] = color.g;
        Main.layersImages[layer].data[offset + 2] = color.b;
        Main.layersImages[layer].data[offset + 3] = color.a;
    });

    // Render paint layer if applicable
    const isTiles = layer === LAYERS.TILES;
    const isWalls = layer === LAYERS.WALLS;
    const paintLayer = isTiles ? LAYERS.TILEPAINT : isWalls ? LAYERS.WALLPAINT : null;

    if (paintLayer && Main.layersImages?.[paintLayer]?.data) {
        tilesArray.forEach(([x, y]) => {
            const tile = getTile(x, y);
            const paintId = isTiles ? tile.blockColor : isWalls ? tile.wallColor : null;

            // Only render normal paint (not special paints 0, 29, 30, 31)
            if (paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
                const color = getPaintColor(tile, paintLayer, paintId, x, y, null);

                if (color) {
                    const offset = (maxTilesX * y + x) * 4;
                    Main.layersImages[paintLayer].data[offset] = color.r;
                    Main.layersImages[paintLayer].data[offset + 1] = color.g;
                    Main.layersImages[paintLayer].data[offset + 2] = color.b;
                    Main.layersImages[paintLayer].data[offset + 3] = color.a;
                }
            }
        });
    }
}

/**
 * Optimistic rendering - renders immediately before worker confirms
 * Provides instant visual feedback with no lag
 *
 * @param {Array<[number, number]>} tilesArray - Array of [x, y] coordinates to render
 * @param {number} layer - LAYERS enum value
 * @param {number|string} newId - The ID being painted (or "delete" for eraser)
 * @param {number} maxTilesX - World width in tiles
 * @param {number} maxTilesY - World height in tiles
 * @param {Object} [tileEditOptions] - Tile editing options (paint, slope, etc.)
 */
export function renderOptimistic(tilesArray, layer, newId, maxTilesX, maxTilesY, tileEditOptions = null) {
    if (!tilesArray || !Array.isArray(tilesArray) || tilesArray.length === 0) {
        return;
    }

    if (!Main.layersImages?.[layer]?.data) {
        return;
    }

    // Filter out of bounds
    tilesArray = tilesArray.filter(([x, y]) =>
        x >= 0 && y >= 0 && x < maxTilesX && y < maxTilesY
    );

    if (tilesArray.length === 0) {
        return;
    }

    // Build optimistic tile once (same for all tiles in this operation)
    const optimisticTile = buildOptimisticTile(layer, newId, tileEditOptions);

    // Render base layer optimistically
    tilesArray.forEach(([x, y]) => {
        const color = getTileColor(optimisticTile, layer, newId, x, y, tileEditOptions);

        const offset = (maxTilesX * y + x) * 4;
        Main.layersImages[layer].data[offset] = color.r;
        Main.layersImages[layer].data[offset + 1] = color.g;
        Main.layersImages[layer].data[offset + 2] = color.b;
        Main.layersImages[layer].data[offset + 3] = color.a;
    });

    // Render paint layer if applicable
    const isTiles = layer === LAYERS.TILES;
    const isWalls = layer === LAYERS.WALLS;
    const paintLayer = isTiles ? LAYERS.TILEPAINT : isWalls ? LAYERS.WALLPAINT : null;

    if (paintLayer && Main.layersImages?.[paintLayer]?.data && tileEditOptions) {
        const paintId = isTiles ? tileEditOptions.blockColor : isWalls ? tileEditOptions.wallColor : null;
        const paintEnabled = isTiles ? tileEditOptions.editBlockColor : isWalls ? tileEditOptions.editWallColor : false;

        if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
            tilesArray.forEach(([x, y]) => {
                const color = getPaintColor(optimisticTile, paintLayer, paintId, x, y, tileEditOptions);

                if (color) {
                    const offset = (maxTilesX * y + x) * 4;
                    Main.layersImages[paintLayer].data[offset] = color.r;
                    Main.layersImages[paintLayer].data[offset + 1] = color.g;
                    Main.layersImages[paintLayer].data[offset + 2] = color.b;
                    Main.layersImages[paintLayer].data[offset + 3] = color.a;
                }
            });
        }
    }
}
