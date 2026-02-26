import workerState from "../../workerState.js";

import editableTiles from "../../../utils/dbs/editable-tiles.js";
import editableWalls from "../../../utils/dbs/editable-walls.js";
import { TileFlag } from "terraria-world-file";

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

            if (tiles.hasBlock(i) && editableTiles[tiles.blockId[i]]) {
                tiles.blockId[i] = parseInt(swappedTileIds[tiles.blockId[i]]);

                if (tiles.wallId[i] !== 0 && editableWalls[tiles.wallId[i]]) {
                    tiles.wallId[i] = parseInt(swappedWallIds[tiles.wallId[i]]);
                    continue;
                }
            }

            if (tiles.wallId[i] !== 0 && editableWalls[tiles.wallId[i]]) {
                tiles.wallId[i] = parseInt(swappedWallIds[tiles.wallId[i]]);
            }
        }
    }

    postMessage({
        action: "RETURN_DONE",
        messageId
    });
}
