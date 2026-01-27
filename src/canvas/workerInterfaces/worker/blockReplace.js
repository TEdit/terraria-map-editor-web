import workerState from "../../workerState.js";

import LAYERS from "../../../utils/dbs/LAYERS.js";

export default async function(data, messageId) {
    const { from, to } = data;
    let replacedBlocks = [];
    let newProperties = {};
    let fromWire = from.layer == LAYERS.WIRES ? "wire" + from.id.charAt(0).toUpperCase() + from.id.slice(1) : null;

    switch (to.layer) {
        case LAYERS.TILES:
            newProperties.blockId = parseInt(to.id);
            break;
        case LAYERS.WALLS:
            newProperties.wallId = parseInt(to.id);
            break;
        case LAYERS.WIRES:
            newProperties["wire" + to.id.charAt(0).toUpperCase() + to.id.slice(1)] = true;
            break;
        case LAYERS.LIQUIDS:
            newProperties.liquidType = to.id;
            newProperties.liquidAmount = 255;
            break;
    }

    let tile;
    const swapOnePercent = workerState.worldObject.header.maxTilesY / 100;
    let swapPercentNext = 0;
    let swapPercent = 0;
    for (let y = 0; y < workerState.worldObject.header.maxTilesY; y++) {
        if (y > swapPercentNext) {
            swapPercentNext += swapOnePercent;
            swapPercent++;
            postMessage({
                action: "RETURN_PROGRESS",
                messageId,
                percent: swapPercent
            });
        }

        for (let x = 0; x < workerState.worldObject.header.maxTilesX; x++) {
            switch (from.layer) {
                case LAYERS.TILES:
                    if (workerState.worldObject.tiles[x][y].blockId !== undefined && workerState.worldObject.tiles[x][y].blockId == from.id){
                        workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], blockId: undefined };
                        workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], ...newProperties };
                        if (to.layer != LAYERS.TILES) {
                            delete workerState.worldObject.tiles[x][y].frameX;
                            delete workerState.worldObject.tiles[x][y].frameY;
                            delete workerState.worldObject.tiles[x][y].slope;
                            delete workerState.worldObject.tiles[x][y].blockColor;
                        }
                        replacedBlocks.push([x,y]);
                    }
                    break;
                case LAYERS.WALLS:
                    if (workerState.worldObject.tiles[x][y].wallId !== undefined && workerState.worldObject.tiles[x][y].wallId == from.id) {
                        workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], wallId: undefined };
                        workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], ...newProperties };
                        if (to.layer != LAYERS.WALLS)
                            delete workerState.worldObject.tiles[x][y].wallColor;
                        replacedBlocks.push([x,y]);
                    }
                    break;
                case LAYERS.WIRES:
                    if (workerState.worldObject.tiles[x][y][fromWire]) {
                        delete workerState.worldObject.tiles[x][y][fromWire];
                        workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], ...newProperties };
                        replacedBlocks.push([x,y]);
                    }
                    break;
                case LAYERS.LIQUIDS:
                    if (workerState.worldObject.tiles[x][y].liquidType !== undefined && workerState.worldObject.tiles[x][y].liquidType == from.id) {
                        if (to.layer != LAYERS.LIQUIDS)
                            workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], liquidType: undefined, liquidAmount: undefined, ...newProperties };
                        else
                            workerState.worldObject.tiles[x][y] = { ...workerState.worldObject.tiles[x][y], liquidType: newProperties.liquidType };
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