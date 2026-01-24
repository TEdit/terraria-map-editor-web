/**
 * Shared utility for applying colors to tiles array for canvas rendering
 * Used by pencil, brush, and bucket fill tools
 *
 * Handles special tile types:
 * - Rainbow brick (ID 160): 3-color pattern based on Y coordinate
 * - Checkerboard (ID 51): 2-color pattern based on X+Y
 * - Normal tiles: Single color
 * - Paint: Applies paint blending when editBlockColor/editWallColor is enabled
 */

import Main from "../canvas/main.js";
import colors from "./dbs/colors.js";
import LAYERS from "./dbs/LAYERS.js";
import { getCoatingBrightness, applyBrightness, applySpecialPaint } from "./colors/paintColorBlending.js";

/**
 * Apply colors to tiles array for canvas rendering
 * Mutates Main.layersImages[layer].data directly
 *
 * @param {Array<[number, number]>} tilesArray - Array of [x, y] coordinates
 * @param {number} layer - LAYERS enum value
 * @param {number|string} id - Tile/wall/liquid ID
 * @param {number} maxTilesX - World width in tiles
 * @param {number} maxTilesY - World height in tiles
 * @param {object} tileEditOptions - Tile editing options (includes paint settings)
 */
export function applyColorToTiles(tilesArray, layer, id, maxTilesX, maxTilesY, tileEditOptions = null) {
    // Validation checks
    if (!tilesArray || !Array.isArray(tilesArray) || tilesArray.length === 0) {
        return;
    }

    if (!Main.layersImages?.[layer]?.data) {
        console.warn("Layer image data missing for color application");
        return;
    }

    // Filter out of bounds tiles
    tilesArray = tilesArray.filter(([x, y]) =>
        x >= 0 && y >= 0 && x < maxTilesX && y < maxTilesY
    );

    if (tilesArray.length === 0) {
        return;
    }

    // Get color data for this tile/wall/liquid ID
    let offset;
    const selectedColor = colors[layer][id] ?? {r: 0, g: 0, b: 0, a: 0};

    // Determine if we should apply paint based on layer and tileEditOptions
    const isTilesLayer = layer === LAYERS.TILES;
    const isWallsLayer = layer === LAYERS.WALLS;

    let paintId = null;
    let brightness = 211; // Default brightness

    // Get paint settings and brightness from tile edit options
    if (tileEditOptions) {
        if (isTilesLayer) {
            // Calculate coating brightness for tiles
            brightness = getCoatingBrightness(
                tileEditOptions.editInvisibleBlock && tileEditOptions.invisibleBlock,
                tileEditOptions.editFullBrightBlock && tileEditOptions.fullBrightBlock
            );
            // Get paint ID if paint is enabled
            if (tileEditOptions.editBlockColor) {
                paintId = tileEditOptions.blockColor;
            }
        } else if (isWallsLayer) {
            // Calculate coating brightness for walls
            brightness = getCoatingBrightness(
                tileEditOptions.editInvisibleWall && tileEditOptions.invisibleWall,
                tileEditOptions.editFullBrightWall && tileEditOptions.fullBrightWall
            );
            // Get paint ID if paint is enabled
            if (tileEditOptions.editWallColor) {
                paintId = tileEditOptions.wallColor;
            }
        }
    }

    // Check if we should render base tile/wall colors
    // Skip if the corresponding edit flag is disabled
    const shouldRenderBaseColor = !tileEditOptions ||
        (isTilesLayer && tileEditOptions.editBlockId) ||
        (isWallsLayer && tileEditOptions.editWallId) ||
        (!isTilesLayer && !isWallsLayer); // Always render for other layers

    // Helper function to apply base color with brightness or special paint
    const applyColor = (baseColor) => {
        // Check if special paint (Shadow=29 or Negative=30)
        if (paintId === 29 || paintId === 30) {
            // Special paints modify the base color
            return applySpecialPaint(baseColor, paintId, brightness, isWallsLayer);
        }
        // For normal paints or no paint, just apply brightness to base color
        return applyBrightness(baseColor, brightness);
    };

    // Only render base tile/wall colors if the edit flag is enabled
    if (shouldRenderBaseColor) {
        // Handle special tile types with multi-color patterns
        if (id == 160) {
            // Rainbow brick (ID 160) - 3-color variation based on Y coordinate
            let temp, color;
            tilesArray.forEach(([x, y]) => {
                temp = y % 3;
                color = applyColor(selectedColor[temp]);
                offset = (maxTilesX * y + x) * 4;
                Main.layersImages[layer].data[offset] = color.r;
                Main.layersImages[layer].data[offset + 1] = color.g;
                Main.layersImages[layer].data[offset + 2] = color.b;
                Main.layersImages[layer].data[offset + 3] = color.a;
            });
        }
        else if (id == 51) {
            // Checkerboard pattern (ID 51) - 2-color variation based on X+Y
            let temp, color;
            tilesArray.forEach(([x, y]) => {
                temp = (x + y) % 2;
                color = applyColor(selectedColor[temp]);
                offset = (maxTilesX * y + x) * 4;
                Main.layersImages[layer].data[offset] = color.r;
                Main.layersImages[layer].data[offset + 1] = color.g;
                Main.layersImages[layer].data[offset + 2] = color.b;
                Main.layersImages[layer].data[offset + 3] = color.a;
            });
        }
        else {
            // Normal tiles - single color for all tiles
            const color = applyColor(selectedColor);
            tilesArray.forEach(([x, y]) => {
                offset = (maxTilesX * y + x) * 4;
                Main.layersImages[layer].data[offset] = color.r;
                Main.layersImages[layer].data[offset + 1] = color.g;
                Main.layersImages[layer].data[offset + 2] = color.b;
                Main.layersImages[layer].data[offset + 3] = color.a;
            });
        }
    }

    // If normal paint is enabled (not special paints 29/30), also render to paint layer
    // Only render paint if there's actually a tile/wall at that position (prevents floating paint on empty tiles)
    if (paintId !== null && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
        const paintLayer = isTilesLayer ? LAYERS.TILEPAINT : isWallsLayer ? LAYERS.WALLPAINT : null;

        if (paintLayer && Main.layersImages?.[paintLayer]?.data) {
            const paintColor = colors[paintLayer][paintId];

            if (paintColor) {
                const worldTiles = Main.state?.canvas?.worldObject?.tiles;

                tilesArray.forEach(([x, y]) => {
                    // Check if there's actually a visible tile/wall at this position
                    let hasTileOrWall = false;
                    if (worldTiles && worldTiles[x] && worldTiles[x][y]) {
                        const tile = worldTiles[x][y];
                        hasTileOrWall = isTilesLayer
                            ? tile.blockId !== undefined  // Tile exists if it has a blockId
                            : isWallsLayer
                                ? tile.wallId !== undefined && tile.wallId !== 0  // Wall exists if wallId > 0
                                : true; // For other layers, always render
                    }

                    // Only render paint if there's a base tile/wall to paint on
                    if (hasTileOrWall || shouldRenderBaseColor) {
                        offset = (maxTilesX * y + x) * 4;
                        Main.layersImages[paintLayer].data[offset] = paintColor.r;
                        Main.layersImages[paintLayer].data[offset + 1] = paintColor.g;
                        Main.layersImages[paintLayer].data[offset + 2] = paintColor.b;
                        Main.layersImages[paintLayer].data[offset + 3] = paintColor.a;
                    }
                });
            }
        }
    }
}
