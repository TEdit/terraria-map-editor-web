/**
 * Shared utility for applying colors to tiles array for canvas rendering
 * Used by pencil, brush, and bucket fill tools
 *
 * Handles special tile types:
 * - Rainbow brick (ID 160): 3-color pattern based on Y coordinate
 * - Checkerboard (ID 51): 2-color pattern based on X+Y
 * - Normal tiles: Single color
 */

import Main from "../canvas/main.js";
import colors from "./dbs/colors.js";

/**
 * Apply colors to tiles array for canvas rendering
 * Mutates Main.layersImages[layer].data directly
 *
 * @param {Array<[number, number]>} tilesArray - Array of [x, y] coordinates
 * @param {number} layer - LAYERS enum value (0-4)
 * @param {number|string} id - Tile/wall/liquid ID
 * @param {number} maxTilesX - World width in tiles
 * @param {number} maxTilesY - World height in tiles
 */
export function applyColorToTiles(tilesArray, layer, id, maxTilesX, maxTilesY) {
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

    // Handle special tile types with multi-color patterns
    if (id == 160) {
        // Rainbow brick (ID 160) - 3-color variation based on Y coordinate
        let temp;
        tilesArray.forEach(([x, y]) => {
            temp = y % 3;
            offset = (maxTilesX * y + x) * 4;
            Main.layersImages[layer].data[offset] = selectedColor[temp].r;
            Main.layersImages[layer].data[offset + 1] = selectedColor[temp].g;
            Main.layersImages[layer].data[offset + 2] = selectedColor[temp].b;
            Main.layersImages[layer].data[offset + 3] = selectedColor[temp].a;
        });
    }
    else if (id == 51) {
        // Checkerboard pattern (ID 51) - 2-color variation based on X+Y
        let temp;
        tilesArray.forEach(([x, y]) => {
            temp = (x + y) % 2;
            offset = (maxTilesX * y + x) * 4;
            Main.layersImages[layer].data[offset] = selectedColor[temp].r;
            Main.layersImages[layer].data[offset + 1] = selectedColor[temp].g;
            Main.layersImages[layer].data[offset + 2] = selectedColor[temp].b;
            Main.layersImages[layer].data[offset + 3] = selectedColor[temp].a;
        });
    }
    else {
        // Normal tiles - single color for all tiles
        tilesArray.forEach(([x, y]) => {
            offset = (maxTilesX * y + x) * 4;
            Main.layersImages[layer].data[offset] = selectedColor.r;
            Main.layersImages[layer].data[offset + 1] = selectedColor.g;
            Main.layersImages[layer].data[offset + 2] = selectedColor.b;
            Main.layersImages[layer].data[offset + 3] = selectedColor.a;
        });
    }
}
