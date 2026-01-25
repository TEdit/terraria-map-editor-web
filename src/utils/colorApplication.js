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
 *
 * @param {number} layer - LAYERS enum value
 * @param {Object} tileEditOptions - Tile editing options
 * @param {Object|null} originalTile - Original tile data (for paint-only operations)
 */
function buildOptimisticTile(layer, tileEditOptions, originalTile = null) {
    const tile = {};

    // Apply IDs based on layer and edit flags
    switch (layer) {
        case LAYERS.TILES:
            if (tileEditOptions?.editBlockId && tileEditOptions.blockId !== undefined) {
                // Editing tile type
                if (tileEditOptions.blockId === "delete" || tileEditOptions.blockId === null) {
                    // Eraser - no blockId
                } else {
                    tile.blockId = parseInt(tileEditOptions.blockId);
                }
            } else if (originalTile?.blockId !== undefined) {
                // Paint-only: preserve original tile type
                tile.blockId = originalTile.blockId;
                if (originalTile.frameX !== undefined) tile.frameX = originalTile.frameX;
                if (originalTile.frameY !== undefined) tile.frameY = originalTile.frameY;
            }
            break;
        case LAYERS.WALLS:
            if (tileEditOptions?.editWallId && tileEditOptions.wallId !== undefined) {
                if (tileEditOptions.wallId === "delete" || tileEditOptions.wallId === null) {
                    // Eraser - no wallId
                } else {
                    tile.wallId = parseInt(tileEditOptions.wallId);
                }
            } else if (originalTile?.wallId !== undefined) {
                tile.wallId = originalTile.wallId;
            }
            break;
        case LAYERS.LIQUIDS:
            if (tileEditOptions?.liquidType !== undefined) {
                tile.liquidType = tileEditOptions.liquidType;
                tile.liquidAmount = 255;
            }
            break;
        case LAYERS.WIRES:
            // Wire editing would go here
            break;
    }

    // Apply paint if specified in options
    if (tileEditOptions) {
        if (tileEditOptions.editBlockColor && tileEditOptions.blockColor !== undefined) {
            tile.blockColor = parseInt(tileEditOptions.blockColor);
        }
        if (tileEditOptions.editWallColor && tileEditOptions.wallColor !== undefined) {
            tile.wallColor = parseInt(tileEditOptions.wallColor);
        }
        if (tileEditOptions.editSlope && tileEditOptions.slope !== undefined) {
            tile.slope = tileEditOptions.slope;
        }
        // Coatings
        if (tileEditOptions.editInvisibleBlock) {
            tile.invisibleBlock = tileEditOptions.invisibleBlock;
        }
        if (tileEditOptions.editFullBrightBlock) {
            tile.fullBrightBlock = tileEditOptions.fullBrightBlock;
        }
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

    // Render paint layer if applicable - ALWAYS update paint layer to clear stale optimistic pixels
    const isTiles = layer === LAYERS.TILES;
    const isWalls = layer === LAYERS.WALLS;
    const paintLayer = isTiles ? LAYERS.TILEPAINT : isWalls ? LAYERS.WALLPAINT : null;

    if (paintLayer && Main.layersImages?.[paintLayer]?.data) {
        tilesArray.forEach(([x, y]) => {
            const tile = getTile(x, y);
            const paintId = isTiles ? tile.blockColor : isWalls ? tile.wallColor : null;
            const hasBaseId = isTiles ? (tile.blockId !== undefined) : (tile.wallId !== undefined && tile.wallId !== 0);
            const offset = (maxTilesX * y + x) * 4;

            // Only render normal paint if tile has base AND valid paint
            if (hasBaseId && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
                const color = getPaintColor(tile, paintLayer, paintId, x, y, null);

                if (color) {
                    Main.layersImages[paintLayer].data[offset] = color.r;
                    Main.layersImages[paintLayer].data[offset + 1] = color.g;
                    Main.layersImages[paintLayer].data[offset + 2] = color.b;
                    Main.layersImages[paintLayer].data[offset + 3] = color.a;
                }
            } else {
                // Clear paint layer pixel - no valid paint here (clears stale optimistic render)
                Main.layersImages[paintLayer].data[offset] = 0;
                Main.layersImages[paintLayer].data[offset + 1] = 0;
                Main.layersImages[paintLayer].data[offset + 2] = 0;
                Main.layersImages[paintLayer].data[offset + 3] = 0;
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
 * @param {number} maxTilesX - World width in tiles
 * @param {number} maxTilesY - World height in tiles
 * @param {Object} [tileEditOptions] - Tile editing options (paint, slope, etc.)
 */
export function renderOptimistic(tilesArray, layer, maxTilesX, maxTilesY, tileEditOptions = null) {
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

    // Check if we're modifying the base layer (tile/wall ID)
    const isTiles = layer === LAYERS.TILES;
    const isWalls = layer === LAYERS.WALLS;
    const isEditingBaseId = isTiles ? tileEditOptions?.editBlockId : isWalls ? tileEditOptions?.editWallId : false;

    // Only render base layer optimistically if we're changing the tile/wall type
    // For paint-only (editBlockId: false), tile data is in worker - skip base layer render
    if (isEditingBaseId) {
        tilesArray.forEach(([x, y]) => {
            const optimisticTile = buildOptimisticTile(layer, tileEditOptions, null);
            const color = getTileColor(optimisticTile, layer, undefined, x, y, tileEditOptions);

            const offset = (maxTilesX * y + x) * 4;
            Main.layersImages[layer].data[offset] = color.r;
            Main.layersImages[layer].data[offset + 1] = color.g;
            Main.layersImages[layer].data[offset + 2] = color.b;
            Main.layersImages[layer].data[offset + 3] = color.a;
        });
    }

    // Render paint layer if applicable
    // Only render paint optimistically if we're ALSO placing a base tile
    // For paint-only operations (editBlockId: false), we can't know if tiles exist - let worker handle it
    const paintLayer = isTiles ? LAYERS.TILEPAINT : isWalls ? LAYERS.WALLPAINT : null;
    const baseId = isTiles ? tileEditOptions?.blockId : isWalls ? tileEditOptions?.wallId : null;
    const hasValidBaseId = baseId !== undefined && baseId !== null && baseId !== "delete";

    if (paintLayer && Main.layersImages?.[paintLayer]?.data && tileEditOptions && isEditingBaseId && hasValidBaseId) {
        const paintId = isTiles ? tileEditOptions.blockColor : isWalls ? tileEditOptions.wallColor : null;
        const paintEnabled = isTiles ? tileEditOptions.editBlockColor : isWalls ? tileEditOptions.editWallColor : false;

        if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
            tilesArray.forEach(([x, y]) => {
                // We're placing a tile, so paint is valid
                const optimisticTile = { blockId: baseId, wallId: baseId };
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
