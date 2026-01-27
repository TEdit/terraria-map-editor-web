/**
 * Unified tile rendering logic
 * Single source of truth for converting tile data to RGBA colors
 * Works for both tool edits and full render from world data
 */

import colors from "../dbs/colors.js";
import LAYERS from "../dbs/LAYERS.js";
import { getCoatingBrightness, applyBrightness, applySpecialPaint } from "../colors/paintColorBlending.js";

/**
 * Get tile variant index for multi-color tiles
 * Handles rainbow brick (160), checkerboard (51), and 40+ other variants
 *
 * @param {number} id - Tile/wall ID
 * @param {number} frameX - Frame X coordinate (default 0)
 * @param {number} frameY - Frame Y coordinate (default 0)
 * @param {number} x - Tile X coordinate (default 0)
 * @param {number} y - Tile Y coordinate (default 0)
 * @returns {number} Variant index for the tile
 */
export function getTileVariantIndex(id, frameX = 0, frameY = 0, x = 0, y = 0) {
    let temp;
    switch(id) {
        //added for rainbow block
        case 160:
            return y % 3;

        //added for cobweb
        case 51:
            return (x + y) % 2;

        case 4:
            return frameX < 66 ? 1 : 0;
        case 15:
            if (Math.floor(frameY / 40) == 1 || Math.floor(frameY / 40) == 20)
                return 1;
            else
                return 0;
        case 21:
        case 421:
            switch (Math.floor(frameX / 36)) {
                case 1:
                case 2:
                case 10:
                case 13:
                case 15:
                    return 1;
                case 3:
                case 4:
                    return 2;
                case 6:
                    return 3;
                case 11:
                case 17:
                    return 4;
                default:
                    return 0;
            }
        case 26:
            return frameX >= 54 ? 1 : 0;
        case 27:
            return frameY < 34 ? 1 : 0;
        case 28:
            if (frameY < 144)
                return 0;
            else if (frameY < 252)
                return 1;
            else if (frameY < 360 || (frameY > 900 && frameY < 1008))
                return 2;
            else if (frameY < 468)
                return 3;
            else if (frameY < 576)
                return 4;
            else if (frameY < 684)
                return 5;
            else if (frameY < 792)
                return 6;
            else if (frameY < 898)
                return 8;
            else if (frameY < 1006)
                return 7;
            else if (frameY < 1114)
                return 0;
            else if (frameY < 1222)
                return 3;
            else
                return 7;
        case 31:
            return frameX >= 36 ? 1 : 0;
        case 82:
        case 83:
        case 84:
            if (frameX < 18)
                return 0;
            else if (frameX < 36)
                return 1;
            else if (frameX < 54)
                return 2;
            else if (frameX < 72)
                return 3;
            else if (frameX < 90)
                return 4;
            else if (frameX < 108)
                return 5;
            else
                return 6;
        case 105:
            if (frameX >= 1548 && frameX <= 1654)
                return 1;
            else if (frameX >= 1656 && frameX <= 1798)
                return 2;
            else
                return 0;
        case 133:
            return frameX < 52 ? 0 : 1;
        case 134:
            return frameX < 28 ? 0 : 1;
        case 137:
            return frameY == 0 ? 0 : 1;
        case 149:
            //changed this one, source code is weird
            if (frameX < 8)
                return 2;
            else if (frameX < 26)
                return 0;
            else if (frameX < 44)
                return 1;
            else if (frameX < 62)
                return 2;
            else if (frameX < 80)
                return 0;
            else if (frameX < 98)
                return 1;
        case 165:
            if (frameX < 54)
                return 0;
            else if (frameX < 106)
                return 1;
            else if (frameX >= 216)
                return 1;
            else if (frameX < 162)
                return 2;
            else
                return 3;
        case 178:
            if (frameX < 18)
                return 0;
            else if (frameX < 36)
                return 1;
            else if (frameX < 54)
                return 2;
            else if (frameX < 72)
                return 3;
            else if (frameX < 90)
                return 4;
            else if (frameX < 108)
                return 5;
            else
                return 6;
        case 184:
            if (frameX < 22)
                return 0;
            else if (frameX < 44)
                return 1;
            else if (frameX < 66)
                return 2;
            else if (frameX < 88)
                return 3;
            else if (frameX < 110)
                return 4;
            else if (frameX < 132)
                return 5;
            else if (frameX < 154)
                return 6;
            else if (frameX < 176)
                return 7;
            else if (frameX < 198)
                return 8;
        case 185:
            if (frameY < 18) {
                temp = Math.floor(frameX / 18);
                if (temp < 6 || temp == 28 || temp == 29 || temp == 30 || temp == 31 || temp == 32)
                    return 0;
                else if (temp < 12 || temp == 33 || temp == 34 || temp == 35)
                    return 1;
                else if (temp < 28)
                    return 2;
                else if (temp < 48)
                    return 3;
                else if (temp < 54)
                    return 4;
                else if (temp < 72)
                    return 0;
                else if (temp == 72)
                    return 1;
            }

            temp = (Math.floor(frameX / 36)) + (Math.floor(frameY / 18) - 1) * 18;
            if (temp < 6 || temp == 19 || temp == 20 || temp == 21 || temp == 22 || temp == 23 || temp == 24 || temp == 33 || temp == 38 || temp == 39 || temp == 40)
                return 0;
            else if (temp < 16)
                return 2;
            else if (temp < 19 || temp == 31 || temp == 32)
                return 1;
            else if (temp < 31)
                return 3;
            else if (temp < 38)
                return 4;
            else if (temp < 59)
                return 0;
            else if (temp < 62)
                return 1;
        case 186:
            temp = Math.floor(frameX / 54);
            if (temp < 7)
                return 2;
            else if (temp < 22 || temp == 33 || temp == 34 || temp == 35)
                return 0;
            else if (temp < 25)
                return 1;
            else if (temp == 25)
                return 5;
            else if (temp < 32)
                return 3;
        case 187:
            temp = (Math.floor(frameX / 54)) + (Math.floor(frameY / 36)) * 36;
            if (temp < 3 || temp == 14 || temp == 15 || temp == 16)
                return 0;
            else if (temp < 6)
                return 6;
            else if (temp < 9)
                return 7;
            else if (temp < 14)
                return 4;
            else if (temp < 18)
                return 4;
            else if (temp < 23)
                return 8;
            else if (temp < 25)
                return 0;
            else if (temp < 29)
                return 1;
            else if (temp < 47)
                return 0;
            else if (temp < 50)
                return 1;
            else if (temp < 52)
                return 10;
            else if (temp < 55)
                return 2;
        case 227:
            return Math.floor(frameX / 34);
        case 240:
            temp = (Math.floor(frameX / 54)) + (Math.floor(frameY / 54)) * 36;
            if ((temp >= 0 && temp <= 11) || (temp >= 36 && temp <= 40) || (temp >= 47 && temp <= 62) || temp >= 72)
                return 0;
            else if ((temp >= 12 && temp <= 15) || (temp >= 18 && temp <= 35) || (temp >= 63 && temp <= 71))
                return 1;
            else if (temp == 16 || temp == 17)
                return 2;
            else if (temp >= 41 && temp <= 45)
                return 3;
            else if (temp == 46)
                return 4;
            return 0;
        case 242:
            return (Math.floor(frameY / 72) >= 22 && Math.floor(frameY / 72) <= 24) ? 1 : 0;
        case 419:
            temp = Math.floor(frameX / 18);
            return temp > 2 ? 2 : temp;
        case 420:
            temp = Math.floor(frameY / 18);
            return temp > 5 ? 5 : temp;
        case 423:
            temp = Math.floor(frameY / 18);
            return temp > 6 ? 6 : temp;
        case 428:
            temp = Math.floor(frameY / 18);
            return temp > 3 ? 3 : temp;
        case 440:
            temp = Math.floor(frameX / 54);
            return temp > 6 ? 6 : temp;
        case 441:
            switch (Math.floor(frameX / 36)) {
                case 1:
                case 2:
                case 10:
                case 13:
                case 15:
                    return 1;
                case 3:
                case 4:
                    return 2;
                case 6:
                    return 3;
                case 11:
                case 17:
                    return 4;
                default:
                    return 0;
            }
        case 453:
            temp = Math.floor(frameX / 36);
            return temp > 2 ? 2 : temp;
        case 457:
            temp = Math.floor(frameX / 36);
            return temp > 4 ? 4 : temp;
        case 467:
        case 468:
            switch (Math.floor(frameX / 36)) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                case 11:
                    return Math.floor(frameX / 36);
                case 12:
                case 13:
                    return 10;
                default:
                    return 0;
            }
        case 493:
            if (frameX < 18)
                return 0;
            else if (frameX < 36)
                return 1;
            else if (frameX < 54)
                return 2;
            else if (frameX < 72)
                return 3;
            else if (frameX < 90)
                return 4;
            else
                return 5;
        case 518:
        case 519:
            return Math.floor(frameY / 18);
        case 529:
            return Math.floor(frameY / 34);
        case 530:
        case 572:
            return Math.floor(frameY / 36);
        case 548:
        case 560:
            temp = Math.floor(frameX / 36);
            return (temp & 3 <= 2) ? temp : 0;
        case 591:
            return Math.floor(frameX / 36);
        case 597:
            temp = Math.floor(frameX / 54);
            return (temp & 15 <= 8) ? temp : 0;
        default:
            return 0;
    }
}

/**
 * Get rendered RGBA color for a single tile
 *
 * @param {Object} tile - Tile object from world data or constructed for tool
 * @param {number} layer - LAYERS enum value
 * @param {number|undefined} id - Explicit ID (overrides tile.blockId/wallId)
 * @param {number} x - Tile X coordinate (for variant calculation)
 * @param {number} y - Tile Y coordinate (for variant calculation)
 * @param {Object|null} tileEditOptions - Optional editing options (affects conditional rendering)
 * @returns {{r: number, g: number, b: number, a: number}} RGBA color
 */
export function getTileColor(tile, layer, id, x, y, tileEditOptions = null) {
    // Determine effective ID
    let effectiveId = id;
    if (effectiveId === undefined) {
        effectiveId = layer === LAYERS.TILES ? tile.blockId :
                     layer === LAYERS.WALLS ? tile.wallId :
                     layer === LAYERS.LIQUIDS ? tile.liquidType : undefined;
    }

    if (effectiveId === undefined) {
        return { r: 0, g: 0, b: 0, a: 0 }; // Transparent
    }

    // Check if we should render base color (conditional logic)
    const shouldRenderBaseColor = !tileEditOptions ||
        (layer === LAYERS.TILES && tileEditOptions.editBlockId) ||
        (layer === LAYERS.WALLS && tileEditOptions.editWallId) ||
        (layer !== LAYERS.TILES && layer !== LAYERS.WALLS);

    if (!shouldRenderBaseColor) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Get base color (handle variants)
    const colorData = colors[layer][effectiveId];
    if (!colorData) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    let baseColor;
    if (colorData.r !== undefined) {
        // Single color tile
        baseColor = colorData;
    } else {
        // Multi-variant tile
        const variantIndex = getTileVariantIndex(
            effectiveId,
            tile.frameX || 0,
            tile.frameY || 0,
            x, y
        );
        baseColor = colorData[variantIndex] || colorData[0];
    }

    // Get coating properties
    let invisibleCoating, fullBrightCoating;
    if (layer === LAYERS.TILES) {
        invisibleCoating = tile.invisibleBlock ||
            (tileEditOptions?.editInvisibleBlock && tileEditOptions.invisibleBlock);
        fullBrightCoating = tile.fullBrightBlock ||
            (tileEditOptions?.editFullBrightBlock && tileEditOptions.fullBrightBlock);
    } else if (layer === LAYERS.WALLS) {
        invisibleCoating = tile.invisibleWall ||
            (tileEditOptions?.editInvisibleWall && tileEditOptions.invisibleWall);
        fullBrightCoating = tile.fullBrightWall ||
            (tileEditOptions?.editFullBrightWall && tileEditOptions.fullBrightWall);
    }

    const brightness = getCoatingBrightness(invisibleCoating, fullBrightCoating);

    // Get paint ID
    let paintId = layer === LAYERS.TILES ?
        (tile.blockColor || (tileEditOptions?.editBlockColor ? tileEditOptions.blockColor : null)) :
        layer === LAYERS.WALLS ?
        (tile.wallColor || (tileEditOptions?.editWallColor ? tileEditOptions.wallColor : null)) :
        null;

    // Apply special paints to base color
    if (paintId === 29 || paintId === 30) {
        return applySpecialPaint(baseColor, paintId, brightness, layer === LAYERS.WALLS);
    }

    // Normal rendering: apply brightness only
    return applyBrightness(baseColor, brightness);
}

/**
 * Get rendered color for paint layer
 *
 * @param {Object} tile - Tile object from world data
 * @param {number} layer - Paint layer (TILEPAINT or WALLPAINT)
 * @param {number} paintId - Paint color ID
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object|null} tileEditOptions - Optional editing options
 * @returns {{r: number, g: number, b: number, a: number}|null} RGBA or null
 */
export function getPaintColor(tile, layer, paintId, x, y, tileEditOptions = null) {
    // Only render normal paints (not 0, 31, 29, 30)
    if (!paintId || paintId === 0 || paintId === 31 || paintId === 29 || paintId === 30) {
        return null;
    }

    // Check if there's a base tile/wall to paint
    const hasBase = layer === LAYERS.TILEPAINT ?
        (tile.blockId !== undefined) :
        (tile.wallId !== undefined && tile.wallId !== 0);

    if (!hasBase) {
        return null;
    }

    const paintColor = colors[layer][paintId];
    return paintColor || null;
}
