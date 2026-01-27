import workerState from "../../workerState.js";

import { FileSaver } from "terraria-world-file";

export default async function(data, messageId) {
    const { worldObject } = data;

    if (!workerState.worldObject) {
        throw new Error("web-worker: save: no world loaded");
        return;
    }

    postMessage({
        action: "RETURN_SAVING_PERCENT_INCOMING",
        messageId
    });

    // Merge main-thread worldObject with worker-held tiles,
    // and remap app naming back to TS library naming for save
    const worldForSave = {
        ...worldObject,
        worldTiles: { tiles: workerState.worldObject.tiles },
        townManager: worldObject.rooms,
    };
    delete worldForSave.tiles;
    delete worldForSave.rooms;

    // Remap NPCs back to TS library naming (NPCs → townNPCs)
    if (worldForSave.NPCs) {
        worldForSave.NPCs = {
            townNPCs: worldForSave.NPCs.NPCs,
            pillars: worldForSave.NPCs.pillars,
        };
    }

    let newWorldFile = new FileSaver();
    newWorldFile = newWorldFile.save(worldForSave, (percent) => {
        postMessage({
            action: "RETURN_SAVING_PERCENT",
            messageId,
            percent
        });
    });

    postMessage({
        action: "RETURN_NEW_WORLD_FILE",
        messageId,
        newWorldFile
    });
}
