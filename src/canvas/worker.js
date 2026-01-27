import workerInterfaces from "./workerInterfaces/worker/index.js";

self.onmessage = async ({ data }) => {
    const messageId = data.messageId;

    try {
        switch(data.action) {

            case "PARSE_WORLD_FILE":
                await workerInterfaces.parseWorldFile(data, messageId);
                break;

            case "RENDER_LAYERS_IMAGES":
                await workerInterfaces.renderLayersImages(data, messageId);
                break;

            case "SAVE_WORLD_FILE":
                await workerInterfaces.saveWorldFile(data, messageId);
                break;

            case "VERIFY_WORLD_FILE_FORMAT":
                await workerInterfaces.verifyWorldFileFormat(data, messageId);
                break;

            case "EDIT_TILES":
                await workerInterfaces.editTiles(data, messageId);
                break;

            case "GET_TILE_DATA":
                await workerInterfaces.getTileData(data, messageId);
                break;

            case "BLOCK_SWAP":
                await workerInterfaces.blockSwap(data, messageId);
                return;

            case "BLOCK_REPLACE":
                await workerInterfaces.blockReplace(data, messageId);
                return;
        }
    } catch (e) {
        console.error("worker error: ", e);
        postMessage({
            action: "ERROR",
            messageId,
            error: {
                ...e,
                stack: e.stack,
                message: e.message
            }
        });
    }
};
