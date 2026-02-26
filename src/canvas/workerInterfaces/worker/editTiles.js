import workerState from "../../workerState.js";

import LAYERS from "../../../utils/dbs/LAYERS.js";
import { TileFlag } from "terraria-world-file";

/**
 * Apply tile edit options to a specific tile
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} options - TileEditOptions object with property values and edit flags
 */
function applyTileEditOptions(x, y, options) {
    const tiles = workerState.worldObject.tiles;
    const i = tiles.index(x, y);
    const layer = options.layer;

    // Apply block/tile ID (only on TILES layer)
    // blockId: null/undefined = no tile selected (no-op), "delete" = explicit erase
    if ((layer === LAYERS.TILES) && options.editBlockId && options.blockId !== undefined && options.blockId !== null) {
        if (options.blockId === "delete") {
            tiles.flags[i] &= ~(TileFlag.IS_BLOCK_ACTIVE | TileFlag.ACTUATOR | TileFlag.ACTUATED | TileFlag.INVISIBLE_BLOCK | TileFlag.FULL_BRIGHT_BLOCK | TileFlag.SLOPE_MASK);
            tiles.frameX[i] = 0;
            tiles.frameY[i] = 0;
            tiles.blockColor[i] = 0;
        } else {
            // If overwriteLiquids is off, skip placing block on tiles that have liquid
            if (options.overwriteLiquids === false && tiles.liquidAmount[i] > 0) {
                // Don't place block — preserve liquid
            } else {
                tiles.blockId[i] = parseInt(options.blockId);
                tiles.flags[i] |= TileFlag.IS_BLOCK_ACTIVE;
                tiles.frameX[i] = 0;  // Reset frame for new tile type
                tiles.frameY[i] = 0;
                // Overwrite liquids: clear liquid when placing a block
                if (options.overwriteLiquids !== false) {
                    tiles.liquidType[i] = 0;
                    tiles.liquidAmount[i] = 0;
                }
            }
        }
    }

    // Apply block paint color (only on TILES or TILEPAINT layer, and only if tile exists)
    if ((layer === LAYERS.TILES || layer === LAYERS.TILEPAINT) && options.editBlockColor && tiles.hasBlock(i)) {
        if (options.blockColor === null || options.blockColor === "delete") {
            tiles.blockColor[i] = 0;
        } else {
            tiles.blockColor[i] = parseInt(options.blockColor);
        }
    }

    // Apply slope (only on TILES layer, and only if tile exists)
    if ((layer === LAYERS.TILES) && options.editSlope && tiles.hasBlock(i)) {
        if (options.slope === null || options.slope === "delete" || options.slope === undefined) {
            tiles.setSlope(i, 0);
        } else {
            tiles.setSlope(i, options.slope);
        }
    }

    // Apply block coatings (only on TILES layer, and only if tile exists)
    if ((layer === LAYERS.TILES) && tiles.hasBlock(i)) {
        if (options.editInvisibleBlock) {
            if (options.invisibleBlock) {
                tiles.flags[i] |= TileFlag.INVISIBLE_BLOCK;
            } else {
                tiles.flags[i] &= ~TileFlag.INVISIBLE_BLOCK;
            }
        }

        if (options.editFullBrightBlock) {
            if (options.fullBrightBlock) {
                tiles.flags[i] |= TileFlag.FULL_BRIGHT_BLOCK;
            } else {
                tiles.flags[i] &= ~TileFlag.FULL_BRIGHT_BLOCK;
            }
        }
    }

    // Apply wall ID (only on WALLS layer)
    // wallId: null/undefined = no wall selected (no-op), "delete" = explicit erase
    if ((layer === LAYERS.WALLS) && options.editWallId && options.wallId !== undefined && options.wallId !== null) {
        if (options.wallId === "delete") {
            tiles.wallId[i] = 0;
            tiles.wallColor[i] = 0;
            tiles.flags[i] &= ~(TileFlag.INVISIBLE_WALL | TileFlag.FULL_BRIGHT_WALL);
        } else {
            tiles.wallId[i] = parseInt(options.wallId);
        }
    }

    // Apply wall paint color (only on WALLS or WALLPAINT layer, and only if wall exists)
    if ((layer === LAYERS.WALLS || layer === LAYERS.WALLPAINT) && options.editWallColor && tiles.wallId[i] !== 0) {
        if (options.wallColor === null || options.wallColor === "delete") {
            tiles.wallColor[i] = 0;
        } else {
            tiles.wallColor[i] = parseInt(options.wallColor);
        }
    }

    // Apply wall coatings (only on WALLS layer, and only if wall exists)
    if ((layer === LAYERS.WALLS) && tiles.wallId[i] !== 0) {
        if (options.editInvisibleWall) {
            if (options.invisibleWall) {
                tiles.flags[i] |= TileFlag.INVISIBLE_WALL;
            } else {
                tiles.flags[i] &= ~TileFlag.INVISIBLE_WALL;
            }
        }

        if (options.editFullBrightWall) {
            if (options.fullBrightWall) {
                tiles.flags[i] |= TileFlag.FULL_BRIGHT_WALL;
            } else {
                tiles.flags[i] &= ~TileFlag.FULL_BRIGHT_WALL;
            }
        }
    }

    // Apply actuator properties (only on TILES or WIRES layer, and only if tile exists)
    if ((layer === LAYERS.TILES || layer === LAYERS.WIRES) && tiles.hasBlock(i)) {
        if (options.editActuator) {
            if (options.actuator) {
                tiles.flags[i] |= TileFlag.ACTUATOR;
            } else {
                tiles.flags[i] &= ~TileFlag.ACTUATOR;
            }
        }

        if (options.editActuated) {
            if (options.actuated) {
                tiles.flags[i] |= TileFlag.ACTUATED;
            } else {
                tiles.flags[i] &= ~TileFlag.ACTUATED;
            }
        }
    }

    // Apply wire properties (only on WIRES layer)
    if (layer === LAYERS.WIRES) {
        if (options.editWireRed) {
            if (options.wireRed) {
                tiles.flags[i] |= TileFlag.WIRE_RED;
            } else {
                tiles.flags[i] &= ~TileFlag.WIRE_RED;
            }
        }

        if (options.editWireGreen) {
            if (options.wireGreen) {
                tiles.flags[i] |= TileFlag.WIRE_GREEN;
            } else {
                tiles.flags[i] &= ~TileFlag.WIRE_GREEN;
            }
        }

        if (options.editWireBlue) {
            if (options.wireBlue) {
                tiles.flags[i] |= TileFlag.WIRE_BLUE;
            } else {
                tiles.flags[i] &= ~TileFlag.WIRE_BLUE;
            }
        }

        if (options.editWireYellow) {
            if (options.wireYellow) {
                tiles.flags[i] |= TileFlag.WIRE_YELLOW;
            } else {
                tiles.flags[i] &= ~TileFlag.WIRE_YELLOW;
            }
        }
    }

    // Apply liquid properties (only on LIQUIDS layer)
    // Liquid and block cannot co-exist: skip if tile has a block
    if (layer === LAYERS.LIQUIDS && !tiles.hasBlock(i)) {
        if (options.editLiquidType && options.liquidType !== undefined) {
            tiles.liquidType[i] = options.liquidType;
            // Default to full liquid amount if type is set but amount isn't being edited
            if (!options.editLiquidAmount) {
                tiles.liquidAmount[i] = 255;
            }
        }

        if (options.editLiquidAmount) {
            const amount = parseInt(options.liquidAmount);
            if (amount === 0) {
                // Remove liquid entirely
                tiles.liquidType[i] = 0;
                tiles.liquidAmount[i] = 0;
            } else {
                tiles.liquidAmount[i] = amount;
                // If no liquid type set, default to water
                if (!tiles.liquidType[i]) {
                    tiles.liquidType[i] = options.liquidType || 1;
                }
            }
        }
    }
}


export default function(data, messageId) {
    const { editType, tileEditArgs, radius, ...options } = data;
    const tiles = workerState.worldObject.tiles;
    const layer = options.layer;

    if (editType == "rectangle") {
        const updatedTiles = [];

        for (let x = tileEditArgs[0][0]; x <= tileEditArgs[1][0]; x++)
            for (let y = tileEditArgs[0][1]; y <= tileEditArgs[1][1]; y++) {
                applyTileEditOptions(x, y, options);

                // Collect updated tile for main thread synchronization
                updatedTiles.push({
                    x,
                    y,
                    tile: tiles.getTile(x, y)
                });
            }

        postMessage({
            action: "RETURN_EDIT_TILES",
            messageId,
            updatedTiles
        });
    }

    else if (editType == "floodfill") {
        const startX = tileEditArgs[0];
        const startY = tileEditArgs[1];
        // radius is destructured from function parameter (undefined = infinite)
        const maxX = workerState.worldObject.header.maxTilesX;
        const maxY = workerState.worldObject.header.maxTilesY;

        // Validate starting coordinates
        if (startX < 0 || startY < 0 || startX >= maxX || startY >= maxY) {
            postMessage({
                action: "RETURN_EDIT_TILES",
                messageId,
                tilesArray: []
            });
            return;
        }

        // Helper to compare tiles (checks properties based on layer and edit options)
        function isTileSame(idx1, idx2, layer, options = {}) {
            switch (layer) {
                case LAYERS.TILES:
                    // Always match by active block state and blockId
                    if (tiles.hasBlock(idx1) !== tiles.hasBlock(idx2)) return false;
                    if (tiles.hasBlock(idx1) && tiles.blockId[idx1] !== tiles.blockId[idx2]) return false;
                    // If editing paint, also require paint color to match
                    if (options.editBlockColor && tiles.blockColor[idx1] !== tiles.blockColor[idx2]) return false;
                    return true;

                case LAYERS.TILEPAINT:
                    // Paint layer: match by blockId and paint color
                    if (tiles.hasBlock(idx1) !== tiles.hasBlock(idx2)) return false;
                    if (tiles.hasBlock(idx1) && tiles.blockId[idx1] !== tiles.blockId[idx2]) return false;
                    if (tiles.blockColor[idx1] !== tiles.blockColor[idx2]) return false;
                    return true;

                case LAYERS.WALLS:
                    // Always match by WallID
                    if (tiles.wallId[idx1] !== tiles.wallId[idx2]) return false;
                    // If editing paint, also require paint color to match
                    if (options.editWallColor && tiles.wallColor[idx1] !== tiles.wallColor[idx2]) return false;
                    return true;

                case LAYERS.WALLPAINT:
                    // Paint layer: match by wallId and paint color
                    if (tiles.wallId[idx1] !== tiles.wallId[idx2]) return false;
                    if (tiles.wallColor[idx1] !== tiles.wallColor[idx2]) return false;
                    return true;

                case LAYERS.WIRES: {
                    const f1 = tiles.flags[idx1];
                    const f2 = tiles.flags[idx2];
                    const wireMask = TileFlag.WIRE_RED | TileFlag.WIRE_GREEN | TileFlag.WIRE_BLUE | TileFlag.WIRE_YELLOW | TileFlag.ACTUATOR | TileFlag.ACTUATED;
                    if ((f1 & wireMask) !== (f2 & wireMask)) return false;
                    return true;
                }

                case LAYERS.LIQUIDS:
                    // Don't fill through solid blocks
                    if (tiles.hasBlock(idx1) || tiles.hasBlock(idx2)) {
                        return false;
                    }
                    const hasLiquid1 = tiles.liquidAmount[idx1] > 0;
                    const hasLiquid2 = tiles.liquidAmount[idx2] > 0;
                    if (hasLiquid1 !== hasLiquid2) return false;
                    if (hasLiquid1 && tiles.liquidType[idx1] !== tiles.liquidType[idx2]) return false;
                    return true;

                default:
                    return false;
            }
        }

        // Get origin tile index
        const originIdx = tiles.index(startX, startY);

        // Flood fill with proper tile comparison
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        const tilesArray = [];
        const updatedTiles = [];

        while (queue.length > 0) {
            const {x, y} = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (x < 0 || y < 0 || x >= maxX || y >= maxY) continue;

            // Check radius constraint (Euclidean distance - circle formula)
            if (radius !== undefined && radius !== null) {
                const deltaX = x - startX;
                const deltaY = y - startY;
                if (deltaX * deltaX + deltaY * deltaY > radius * radius) continue;
            }

            const currentIdx = tiles.index(x, y);

            // Use isTileSame to check properties (paint matching depends on edit options)
            if (!isTileSame(originIdx, currentIdx, layer, options)) continue;

            visited.add(key);

            applyTileEditOptions(x, y, options);

            tilesArray.push([x, y]);

            // Collect updated tile for main thread synchronization
            updatedTiles.push({
                x,
                y,
                tile: tiles.getTile(x, y)
            });

            // 4-way neighbors
            queue.push({x: x+1, y: y});
            queue.push({x: x-1, y: y});
            queue.push({x: x, y: y+1});
            queue.push({x: x, y: y-1});
        }

        postMessage({
            action: "RETURN_EDIT_TILES",
            messageId,
            tilesArray,
            updatedTiles
        });
    }

    else if (editType == "tileslist") {
        // tileEditArgs is an array of [x, y] coordinates
        const tilesArray = tileEditArgs;
        const updatedTiles = [];

        tilesArray.forEach(([x, y]) => {
            applyTileEditOptions(x, y, options);

            // Collect updated tile for main thread synchronization
            updatedTiles.push({
                x,
                y,
                tile: tiles.getTile(x, y)
            });
        });

        postMessage({
            action: "RETURN_EDIT_TILES",
            messageId,
            updatedTiles
        });
    }
}
