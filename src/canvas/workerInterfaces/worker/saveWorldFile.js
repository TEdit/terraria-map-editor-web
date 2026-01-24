import Worker from "../../worker.js";

import terrariaWorldSaver from "../../../../terraria-world-file-js/src/browser/terraria-world-saver.js";

export default async function(data, messageId) {
    const { worldObject } = data;

    if (!Worker.worldObject) {
        throw new Error("web-worker: save: no world loaded");
        return;
    }

    postMessage({
        action: "RETURN_SAVING_PERCENT_INCOMING",
        messageId
    });

    let newWorldFile = new terrariaWorldSaver();
    newWorldFile = newWorldFile.save({
        world: {
            ...worldObject,
            tiles: Worker.worldObject.tiles
        },
        progressCallback: (percent) => {
            postMessage({
                action: "RETURN_SAVING_PERCENT",
                messageId,
                percent
            });
        }
    });

    postMessage({
        action: "RETURN_NEW_WORLD_FILE",
        messageId,
        newWorldFile
    });
}