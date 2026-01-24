import Worker from "../../worker.js";

import colors, { getTileVariantIndex } from "../../../utils/dbs/colors.js";
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

    // Apply block/tile ID
    if (options.editBlockId && options.blockId !== undefined) {
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

    // Apply block paint color
    if (options.editBlockColor) {
        if (options.blockColor === null || options.blockColor === "delete") {
            delete tile.blockColor;
        } else {
            tile.blockColor = parseInt(options.blockColor);
        }
    }

    // Apply slope (only if tile exists)
    if (options.editSlope && tile.blockId !== undefined) {
        if (options.slope === null || options.slope === "delete" || options.slope === undefined) {
            delete tile.slope;
        } else {
            tile.slope = options.slope;  // "half", "TR", "TL", "BR", "BL"
        }
    }

    // Apply block coatings (only if tile exists)
    if (tile.blockId !== undefined) {
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

    // Apply wall ID
    if (options.editWallId && options.wallId !== undefined) {
        if (options.wallId === "delete" || options.wallId === null) {
            delete tile.wallId;
            delete tile.wallColor;
            delete tile.invisibleWall;
            delete tile.fullBrightWall;
        } else {
            tile.wallId = parseInt(options.wallId);
        }
    }

    // Apply wall paint color
    if (options.editWallColor) {
        if (options.wallColor === null || options.wallColor === "delete") {
            delete tile.wallColor;
        } else {
            tile.wallColor = parseInt(options.wallColor);
        }
    }

    // Apply wall coatings (only if wall exists)
    if (tile.wallId !== undefined) {
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

    // Apply actuator properties (only if tile exists)
    if (tile.blockId !== undefined && tile.blockId > 0) {
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
}

function changeTile(LAYER, x, y, newId) {
    //original 2d tiles array is full of references because of RLE, dont wanna change them too!
    Worker.worldObject.tiles[x][y] = { ...Worker.worldObject.tiles[x][y] };

    if (newId == "delete") {
        switch(LAYER) {
            case 100: //all
                Worker.worldObject.tiles[x][y] = {};
                break;

            case LAYERS.TILES:
                delete Worker.worldObject.tiles[x][y].blockId;
                delete Worker.worldObject.tiles[x][y].frameX;
                delete Worker.worldObject.tiles[x][y].frameY;
                delete Worker.worldObject.tiles[x][y].slope;
                delete Worker.worldObject.tiles[x][y].blockColor;
                break;

            case LAYERS.WALLS:
                delete Worker.worldObject.tiles[x][y].wallId;
                delete Worker.worldObject.tiles[x][y].wallColor;
                break;

            case LAYERS.WIRES:
                delete Worker.worldObject.tiles[x][y].wireRed;
                delete Worker.worldObject.tiles[x][y].wireGreen;
                delete Worker.worldObject.tiles[x][y].wireBlue;
                delete Worker.worldObject.tiles[x][y].wireYellow;
                delete Worker.worldObject.tiles[x][y].actuator;
                delete Worker.worldObject.tiles[x][y].actuated;
                break;

            case LAYERS.LIQUIDS:
                delete Worker.worldObject.tiles[x][y].liquidType;
                delete Worker.worldObject.tiles[x][y].liquidAmount;
                break;

            case LAYERS["Painted Tiles"]:
                delete Worker.worldObject.tiles[x][y].blockColor;
                break;

            case LAYERS["Painted Walls"]:
                delete Worker.worldObject.tiles[x][y].wallColor;
                break;
        }
    } else {
        switch(LAYER) {
            case LAYERS.TILES:
                Worker.worldObject.tiles[x][y].blockId = parseInt(newId);
                delete Worker.worldObject.tiles[x][y].frameX;
                delete Worker.worldObject.tiles[x][y].frameY;
                delete Worker.worldObject.tiles[x][y].slope;
                delete Worker.worldObject.tiles[x][y].blockColor;
                break;

            case LAYERS.WALLS:
                Worker.worldObject.tiles[x][y].wallId = parseInt(newId);
                delete Worker.worldObject.tiles[x][y].wallColor;
                break;

            case LAYERS.WIRES:
                Worker.worldObject.tiles[x][y]["wire" + newId.charAt(0).toUpperCase() + newId.slice(1)] = true;
                break;

            case LAYERS.LIQUIDS:
                Worker.worldObject.tiles[x][y].liquidType = newId;
                Worker.worldObject.tiles[x][y].liquidAmount = 255;
                break;

            case LAYERS["Painted Tiles"]:
                Worker.worldObject.tiles[x][y].blockColor = newId;
                break;

            case LAYERS["Painted Walls"]:
                Worker.worldObject.tiles[x][y].wallColor = newId;
                break;
        }
    }
}

export default function({ LAYER, editType, editArgs, newId, radius, tileEditOptions }) {
    if (editType == "rectangle") {
        for (let x = editArgs[0][0]; x <= editArgs[1][0]; x++)
            for (let y = editArgs[0][1]; y <= editArgs[1][1]; y++) {
                // Use new tileEditOptions if provided, otherwise fall back to legacy layer-based editing
                if (tileEditOptions) {
                    applyTileEditOptions(x, y, tileEditOptions);
                } else {
                    changeTile(LAYER, x, y, newId);
                }
            }

        postMessage({
            action: "RETURN_EDIT_TILES"
        });
    }

    else if (editType == "floodfill") {
        const startX = editArgs[0];
        const startY = editArgs[1];
        // radius is destructured from function parameter (undefined = infinite)
        const maxX = Worker.worldObject.header.maxTilesX;
        const maxY = Worker.worldObject.header.maxTilesY;

        // Validate starting coordinates
        if (startX < 0 || startY < 0 || startX >= maxX || startY >= maxY) {
            postMessage({
                action: "RETURN_EDIT_TILES",
                tilesArray: []
            });
            return;
        }

        // Helper to compare tiles (checks ALL properties, not just ID)
        function isTileSame(tile1, tile2, layer) {
            const eq = (a, b) => (a === undefined && b === undefined) || a === b;

            switch (layer) {
                case LAYERS.TILES:
                    // Match TileID and paint color, but NOT slope (fills through half-blocks/slopes)
                    if (!eq(tile1.blockId, tile2.blockId)) return false;
                    if (!eq(tile1.blockColor, tile2.blockColor)) return false;
                    return true;

                case LAYERS.WALLS:
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

        // Check if already filled with target
        let alreadyFilled = false;
        switch(LAYER) {
            case LAYERS.TILES:
                alreadyFilled = originTile.blockId === newId;
                break;
            case LAYERS.WALLS:
                alreadyFilled = originTile.wallId === newId;
                break;
            case LAYERS.LIQUIDS:
                alreadyFilled = originTile.liquidType === newId && originTile.liquidAmount > 0;
                break;
        }

        if (alreadyFilled) {
            postMessage({ action: "RETURN_EDIT_TILES" });
            return;
        }

        // Flood fill with proper tile comparison
        const visited = new Set();
        const queue = [{x: startX, y: startY}];
        const tilesArray = [];

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

            // Use isTileSame to check ALL properties
            if (!isTileSame(originTile, currentTile, LAYER)) continue;

            visited.add(key);

            // Use new tileEditOptions if provided, otherwise fall back to legacy layer-based editing
            if (tileEditOptions) {
                applyTileEditOptions(x, y, tileEditOptions);
            } else {
                changeTile(LAYER, x, y, newId);
            }

            tilesArray.push([x, y]);

            // 4-way neighbors
            queue.push({x: x+1, y: y});
            queue.push({x: x-1, y: y});
            queue.push({x: x, y: y+1});
            queue.push({x: x, y: y-1});
        }

        postMessage({
            action: "RETURN_EDIT_TILES",
            tilesArray
        });
    }
}