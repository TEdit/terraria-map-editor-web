import workerState from "../../workerState.js";

import LAYERS from "../../../utils/dbs/LAYERS.js";
import { TileFlag } from "terraria-world-file";

export default async function(data, messageId) {
    const { from, to } = data;
    let replacedBlocks = [];
    let newProperties = {};
    let fromWire = from.layer == LAYERS.WIRES ? "wire" + from.id.charAt(0).toUpperCase() + from.id.slice(1) : null;

    // Map wire names to TileFlag values
    const wireFlagMap = {
        wireRed: TileFlag.WIRE_RED,
        wireBlue: TileFlag.WIRE_BLUE,
        wireGreen: TileFlag.WIRE_GREEN,
        wireYellow: TileFlag.WIRE_YELLOW,
    };
    const fromWireFlag = fromWire ? wireFlagMap[fromWire] : null;
    const toWireFlag = to.layer == LAYERS.WIRES ? wireFlagMap["wire" + to.id.charAt(0).toUpperCase() + to.id.slice(1)] : null;

    const tiles = workerState.worldObject.tiles;
    const maxTilesX = workerState.worldObject.header.maxTilesX;
    const maxTilesY = workerState.worldObject.header.maxTilesY;
    const height = tiles.height;

    const swapOnePercent = maxTilesY / 100;
    let swapPercentNext = 0;
    let swapPercent = 0;
    for (let y = 0; y < maxTilesY; y++) {
        if (y > swapPercentNext) {
            swapPercentNext += swapOnePercent;
            swapPercent++;
            postMessage({
                action: "RETURN_PROGRESS",
                messageId,
                percent: swapPercent
            });
        }

        for (let x = 0; x < maxTilesX; x++) {
            const i = x * height + y;

            switch (from.layer) {
                case LAYERS.TILES:
                    if (tiles.hasBlock(i) && tiles.blockId[i] == from.id) {
                        // Clear block
                        tiles.flags[i] &= ~(TileFlag.IS_BLOCK_ACTIVE | TileFlag.SLOPE_MASK);
                        tiles.frameX[i] = 0;
                        tiles.frameY[i] = 0;
                        tiles.blockColor[i] = 0;

                        // Apply replacement
                        if (to.layer == LAYERS.TILES) {
                            tiles.blockId[i] = parseInt(to.id);
                            tiles.flags[i] |= TileFlag.IS_BLOCK_ACTIVE;
                        } else if (to.layer == LAYERS.WALLS) {
                            tiles.wallId[i] = parseInt(to.id);
                        } else if (to.layer == LAYERS.WIRES && toWireFlag) {
                            tiles.flags[i] |= toWireFlag;
                        } else if (to.layer == LAYERS.LIQUIDS) {
                            tiles.liquidType[i] = to.id;
                            tiles.liquidAmount[i] = 255;
                        }
                        replacedBlocks.push([x,y]);
                    }
                    break;
                case LAYERS.WALLS:
                    if (tiles.wallId[i] !== 0 && tiles.wallId[i] == from.id) {
                        // Clear wall
                        tiles.wallId[i] = 0;
                        tiles.wallColor[i] = 0;

                        // Apply replacement
                        if (to.layer == LAYERS.TILES) {
                            tiles.blockId[i] = parseInt(to.id);
                            tiles.flags[i] |= TileFlag.IS_BLOCK_ACTIVE;
                        } else if (to.layer == LAYERS.WALLS) {
                            tiles.wallId[i] = parseInt(to.id);
                        } else if (to.layer == LAYERS.WIRES && toWireFlag) {
                            tiles.flags[i] |= toWireFlag;
                        } else if (to.layer == LAYERS.LIQUIDS) {
                            tiles.liquidType[i] = to.id;
                            tiles.liquidAmount[i] = 255;
                        }
                        replacedBlocks.push([x,y]);
                    }
                    break;
                case LAYERS.WIRES:
                    if (fromWireFlag && (tiles.flags[i] & fromWireFlag)) {
                        tiles.flags[i] &= ~fromWireFlag;

                        // Apply replacement
                        if (to.layer == LAYERS.TILES) {
                            tiles.blockId[i] = parseInt(to.id);
                            tiles.flags[i] |= TileFlag.IS_BLOCK_ACTIVE;
                        } else if (to.layer == LAYERS.WALLS) {
                            tiles.wallId[i] = parseInt(to.id);
                        } else if (to.layer == LAYERS.WIRES && toWireFlag) {
                            tiles.flags[i] |= toWireFlag;
                        } else if (to.layer == LAYERS.LIQUIDS) {
                            tiles.liquidType[i] = to.id;
                            tiles.liquidAmount[i] = 255;
                        }
                        replacedBlocks.push([x,y]);
                    }
                    break;
                case LAYERS.LIQUIDS:
                    if (tiles.liquidType[i] !== 0 && tiles.liquidType[i] == from.id) {
                        if (to.layer != LAYERS.LIQUIDS) {
                            tiles.liquidType[i] = 0;
                            tiles.liquidAmount[i] = 0;
                        }

                        // Apply replacement
                        if (to.layer == LAYERS.TILES) {
                            tiles.blockId[i] = parseInt(to.id);
                            tiles.flags[i] |= TileFlag.IS_BLOCK_ACTIVE;
                        } else if (to.layer == LAYERS.WALLS) {
                            tiles.wallId[i] = parseInt(to.id);
                        } else if (to.layer == LAYERS.WIRES && toWireFlag) {
                            tiles.flags[i] |= toWireFlag;
                        } else if (to.layer == LAYERS.LIQUIDS) {
                            tiles.liquidType[i] = to.id;
                        }
                        replacedBlocks.push([x,y]);
                    }
                    break;
            }
        }
    }

    postMessage({
        action: "RETURN_DONE",
        messageId,
        replacedBlocks
    });
}
