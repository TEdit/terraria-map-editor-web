import workerState from "../../workerState.js";

import { FileReader } from "terraria-world-file";
import { fileLoader } from "terraria-world-file/browser";

export default async function(data, messageId) {
    const { worldFile, unsafe, unsafeOnlyTiles, ignoreBounds } = data;

    postMessage({
        action: "RETURN_PARSING_PERCENT_INCOMING",
        messageId
    });

    const parser = await new FileReader().loadFile(fileLoader, worldFile);

    const progressCallback = (percent) => {
        postMessage({
            action: "RETURN_PARSING_PERCENT",
            messageId,
            percent: percent
        });
    };

    let worldObject;

    if (unsafeOnlyTiles) {
        worldObject = parser.parse({
            sections: ["fileFormatHeader", "header", "worldTiles"],
            ignorePointers: unsafe,
            ignoreBounds,
            progressCallback
        });

        // Unwrap WorldTilesData.tiles and remap for app compatibility
        worldObject.tiles = worldObject.worldTiles.tiles;
        delete worldObject.worldTiles;
    } else {
        worldObject = parser.parse({
            ignorePointers: unsafe,
            ignoreBounds,
            progressCallback
        });

        // Unwrap WorldTilesData.tiles and remap section names for app compatibility
        worldObject.tiles = worldObject.worldTiles.tiles;
        delete worldObject.worldTiles;
        worldObject.rooms = worldObject.townManager;
        delete worldObject.townManager;

        // Remap NPCsData.townNPCs → NPCs for app compatibility
        if (worldObject.NPCs) {
            worldObject.NPCs.NPCs = worldObject.NPCs.townNPCs;
            delete worldObject.NPCs.townNPCs;
        }
    }

    workerState.worldObject = worldObject;

    postMessage({
        action: "RETURN_WORLD_OBJECT",
        messageId,
        worldObject: {
            ...workerState.worldObject,
            tiles: undefined
        }
    });
}
