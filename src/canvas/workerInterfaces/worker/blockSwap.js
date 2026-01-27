import workerState from "../../workerState.js";

import editableTiles from "../../../utils/dbs/editable-tiles.js";
import editableWalls from "../../../utils/dbs/editable-walls.js";

const arrayShuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * i)
        const temp = array[i]
        array[i] = array[j]
        array[j] = temp
    }
    return array;
}

export default async function(data, messageId) {
    let swappedTileIds = {},
        swappedWallIds = {};

    const shuffledTileIdsArray = arrayShuffle(Object.keys(editableTiles));
    for (const id in editableTiles)
        swappedTileIds[id] = shuffledTileIdsArray.shift();

    const shuffledWallIdsArray = arrayShuffle(Object.keys(editableWalls));
    for (const id in editableWalls)
        swappedWallIds[id] = shuffledWallIdsArray.shift();

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
            if (workerState.worldObject.tiles[x][y].blockId !== undefined && editableTiles[workerState.worldObject.tiles[x][y].blockId]) {
                workerState.worldObject.tiles[x][y] = {...workerState.worldObject.tiles[x][y]};
                workerState.worldObject.tiles[x][y].blockId = parseInt(swappedTileIds[workerState.worldObject.tiles[x][y].blockId]);

                if (workerState.worldObject.tiles[x][y].wallId !== undefined && editableWalls[workerState.worldObject.tiles[x][y].wallId]) {
                    workerState.worldObject.tiles[x][y].wallId = parseInt(swappedWallIds[workerState.worldObject.tiles[x][y].wallId]);
                    continue;
                }
            }

            if (workerState.worldObject.tiles[x][y].wallId !== undefined && editableWalls[workerState.worldObject.tiles[x][y].wallId]) {
                workerState.worldObject.tiles[x][y] = {...workerState.worldObject.tiles[x][y]};
                workerState.worldObject.tiles[x][y].wallId = parseInt(swappedWallIds[workerState.worldObject.tiles[x][y].wallId]);
            }
        }
    }

    postMessage({
        action: "RETURN_DONE",
        messageId
    });
}