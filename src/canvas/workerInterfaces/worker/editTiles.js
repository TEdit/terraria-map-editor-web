import Worker from "../../worker.js";

import LAYERS from "../../../utils/dbs/LAYERS.js";

/**
 * Apply tile edit options to a specific tile
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} options - TileEditOptions object with property values and edit flags
 */
function applyTileEditOptions(x, y, options) {
    // Create a copy to avoid RLE issues
    Worker.worldObject.tiles[x][y] = { ...Worker.worldObject.tiles[x][y] };
    const tile = Worker.worldObject.tiles[x][y];

    const layer = options.layer;

    // Apply block/tile ID (only on TILES layer)
    // DEBUG: Log the condition check
    if (x === 0 || y === 0) console.log('[WORKER] blockId check:', layer === LAYERS.TILES, options.editBlockId, options.blockId !== undefined, 'current tile.blockId:', tile.blockId);
    if ((layer === LAYERS.TILES) && options.editBlockId && options.blockId !== undefined) {
        if (options.blockId === "delete" || options.blockId === null) {
            delete tile.blockId;
            delete tile.frameX;
            delete tile.frameY;
            delete tile.slope;
            delete tile.blockColor;
            delete tile.actuator;
            delete tile.actuated;
            delete tile.invisibleBlock;
            delete tile.fullBrightBlock;
        } else {
            tile.blockId = parseInt(options.blockId);
            delete tile.frameX;  // Reset frame for new tile type
            delete tile.frameY;
        }
    }

    // Apply block paint color (only on TILES or TILEPAINT layer, and only if tile exists)
    if ((layer === LAYERS.TILES || layer === LAYERS.TILEPAINT) && options.editBlockColor && tile.blockId !== undefined) {
        if (options.blockColor === null || options.blockColor === "delete") {
            delete tile.blockColor;
        } else {
            tile.blockColor = parseInt(options.blockColor);
        }
    }

    // Apply slope (only on TILES layer, and only if tile exists)
    if ((layer === LAYERS.TILES) && options.editSlope && tile.blockId !== undefined) {
        if (options.slope === null || options.slope === "delete" || options.slope === undefined) {
            delete tile.slope;
        } else {
            tile.slope = options.slope;  // "half", "TR", "TL", "BR", "BL"
        }
    }

    // Apply block coatings (only on TILES layer, and only if tile exists)
    if ((layer === LAYERS.TILES) && tile.blockId !== undefined) {
        if (options.editInvisibleBlock) {
            if (options.invisibleBlock) {
                tile.invisibleBlock = true;
            } else {
                delete tile.invisibleBlock;
            }
        }

        if (options.editFullBrightBlock) {
            if (options.fullBrightBlock) {
                tile.fullBrightBlock = true;
            } else {
                delete tile.fullBrightBlock;
            }
        }
    }

    // Apply wall ID (only on WALLS layer)
    if ((layer === LAYERS.WALLS) && options.editWallId && options.wallId !== undefined) {
        if (options.wallId === "delete" || options.wallId === null) {
            delete tile.wallId;
            delete tile.wallColor;
            delete tile.invisibleWall;
            delete tile.fullBrightWall;
        } else {
            tile.wallId = parseInt(options.wallId);
        }
    }

    // Apply wall paint color (only on WALLS or WALLPAINT layer, and only if wall exists)
    if ((layer === LAYERS.WALLS || layer === LAYERS.WALLPAINT) && options.editWallColor && tile.wallId !== undefined && tile.wallId !== 0) {
        if (options.wallColor === null || options.wallColor === "delete") {
            delete tile.wallColor;
        } else {
            tile.wallColor = parseInt(options.wallColor);
        }
    }

    // Apply wall coatings (only on WALLS layer, and only if wall exists)
    if ((layer === LAYERS.WALLS) && tile.wallId !== undefined) {
        if (options.editInvisibleWall) {
            if (options.invisibleWall) {
                tile.invisibleWall = true;
            } else {
                delete tile.invisibleWall;
            }
        }

        if (options.editFullBrightWall) {
            if (options.fullBrightWall) {
                tile.fullBrightWall = true;
            } else {
                delete tile.fullBrightWall;
            }
        }
    }

    // Apply actuator properties (only on TILES or WIRES layer, and only if tile exists)
    if ((layer === LAYERS.TILES || layer === LAYERS.WIRES) && tile.blockId !== undefined && tile.blockId > 0) {
        if (options.editActuator) {
            if (options.actuator) {
                tile.actuator = true;
            } else {
                delete tile.actuator;
            }
        }

        if (options.editActuated) {
            if (options.actuated) {
                tile.actuated = true;
            } else {
                delete tile.actuated;
            }
        }
    }

    // Apply wire properties (only on WIRES layer)
    if (layer === LAYERS.WIRES) {
        if (options.editWireRed) {
            if (options.wireRed) {
                tile.wireRed = true;
            } else {
                delete tile.wireRed;
            }
        }

        if (options.editWireGreen) {
            if (options.wireGreen) {
                tile.wireGreen = true;
            } else {
                delete tile.wireGreen;
            }
        }

        if (options.editWireBlue) {
            if (options.wireBlue) {
                tile.wireBlue = true;
            } else {
                delete tile.wireBlue;
            }
        }

        if (options.editWireYellow) {
            if (options.wireYellow) {
                tile.wireYellow = true;
            } else {
                delete tile.wireYellow;
            }
        }
    }

    // Apply liquid properties (only on LIQUIDS layer)
    if (layer === LAYERS.LIQUIDS) {
        if (options.editLiquidType && options.liquidType !== undefined) {
            tile.liquidType = options.liquidType;
            // Default to full liquid amount if type is set but amount isn't being edited
            if (!options.editLiquidAmount) {
                tile.liquidAmount = 255;
            }
        }

        if (options.editLiquidAmount) {
            const amount = parseInt(options.liquidAmount);
            if (amount === 0) {
                // Remove liquid entirely
                delete tile.liquidType;
                delete tile.liquidAmount;
            } else {
                tile.liquidAmount = amount;
                // If no liquid type set, default to water
                if (!tile.liquidType) {
                    tile.liquidType = options.liquidType || "water";
                }
            }
        }
    }
}


export default function(data, messageId) {
    const { editType, tileEditArgs, radius, ...options } = data;
    const layer = options.layer;

    // DEBUG: Log what worker receives
    console.log('[WORKER] editBlockId:', options.editBlockId, 'blockId:', options.blockId, 'editBlockColor:', options.editBlockColor, 'blockColor:', options.blockColor);

    if (editType == "rectangle") {
        const updatedTiles = [];

        for (let x = tileEditArgs[0][0]; x <= tileEditArgs[1][0]; x++)
            for (let y = tileEditArgs[0][1]; y <= tileEditArgs[1][1]; y++) {
                applyTileEditOptions(x, y, options);

                // Collect updated tile for main thread synchronization
                updatedTiles.push({
                    x,
                    y,
                    tile: Worker.worldObject.tiles[x][y]
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
        const maxX = Worker.worldObject.header.maxTilesX;
        const maxY = Worker.worldObject.header.maxTilesY;

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
        function isTileSame(tile1, tile2, layer, options = {}) {
            const eq = (a, b) => (a === undefined && b === undefined) || a === b;

            switch (layer) {
                case LAYERS.TILES:
                    // Always match by TileID (not slope - fills through half-blocks/slopes)
                    if (!eq(tile1.blockId, tile2.blockId)) return false;
                    // If editing paint, also require paint color to match
                    if (options.editBlockColor && !eq(tile1.blockColor, tile2.blockColor)) return false;
                    return true;

                case LAYERS.TILEPAINT:
                    // Paint layer: match by blockId and paint color
                    if (!eq(tile1.blockId, tile2.blockId)) return false;
                    if (!eq(tile1.blockColor, tile2.blockColor)) return false;
                    return true;

                case LAYERS.WALLS:
                    // Always match by WallID
                    if (!eq(tile1.wallId, tile2.wallId)) return false;
                    // If editing paint, also require paint color to match
                    if (options.editWallColor && !eq(tile1.wallColor, tile2.wallColor)) return false;
                    return true;

                case LAYERS.WALLPAINT:
                    // Paint layer: match by wallId and paint color
                    if (!eq(tile1.wallId, tile2.wallId)) return false;
                    if (!eq(tile1.wallColor, tile2.wallColor)) return false;
                    return true;

                case LAYERS.WIRES:
                    if (!eq(tile1.wireRed, tile2.wireRed)) return false;
                    if (!eq(tile1.wireGreen, tile2.wireGreen)) return false;
                    if (!eq(tile1.wireBlue, tile2.wireBlue)) return false;
                    if (!eq(tile1.wireYellow, tile2.wireYellow)) return false;
                    if (!eq(tile1.actuator, tile2.actuator)) return false;
                    if (!eq(tile1.actuated, tile2.actuated)) return false;
                    return true;

                case LAYERS.LIQUIDS:
                    // Don't fill through solid blocks
                    if (tile1.blockId !== undefined || tile2.blockId !== undefined) {
                        return false;
                    }
                    const hasLiquid1 = (tile1.liquidAmount || 0) > 0;
                    const hasLiquid2 = (tile2.liquidAmount || 0) > 0;
                    if (hasLiquid1 !== hasLiquid2) return false;
                    if (hasLiquid1 && !eq(tile1.liquidType, tile2.liquidType)) return false;
                    return true;

                default:
                    return false;
            }
        }

        // Get origin tile (full tile object, not just ID)
        const originTile = Worker.worldObject.tiles[startX][startY];

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

            const currentTile = Worker.worldObject.tiles[x][y];

            // Use isTileSame to check properties (paint matching depends on edit options)
            if (!isTileSame(originTile, currentTile, layer, options)) continue;

            visited.add(key);

            applyTileEditOptions(x, y, options);

            tilesArray.push([x, y]);

            // Collect updated tile for main thread synchronization
            updatedTiles.push({
                x,
                y,
                tile: Worker.worldObject.tiles[x][y]
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
                tile: Worker.worldObject.tiles[x][y]
            });
        });

        postMessage({
            action: "RETURN_EDIT_TILES",
            messageId,
            updatedTiles
        });
    }
}