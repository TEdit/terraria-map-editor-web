import workerInterfaces from "./workerInterfaces/worker/index.js";

let Worker = new function() {
    this.worldObject;
    this.workerInterfaces = workerInterfaces;

    this.interfacesController = async ({ data }) => {
        // Extract messageId for correlation with main thread request
        const messageId = data.messageId;

        try {
            switch(data.action) {

                case "PARSE_WORLD_FILE":
                    await this.workerInterfaces.parseWorldFile(data, messageId);
                    break;

                case "RENDER_LAYERS_IMAGES":
                    await this.workerInterfaces.renderLayersImages(data, messageId);
                    break;

                case "SAVE_WORLD_FILE":
                    await this.workerInterfaces.saveWorldFile(data, messageId);
                    break;

                case "VERIFY_WORLD_FILE_FORMAT":
                    await this.workerInterfaces.verifyWorldFileFormat(data, messageId);
                    break;

                case "EDIT_TILES":
                    await this.workerInterfaces.editTiles(data, messageId);
                    break;

                case "GET_TILE_DATA":
                    await this.workerInterfaces.getTileData(data, messageId);
                    break;

                case "BLOCK_SWAP":
                    await this.workerInterfaces.blockSwap(data, messageId);
                    return;

                case "BLOCK_REPLACE":
                    await this.workerInterfaces.blockReplace(data, messageId);
                    return;
            }
        } catch (e) {
            console.error("worker error: ", e);
            postMessage({
                action: "ERROR",
                messageId, // Include messageId for error correlation
                error: {
                    ...e,
                    stack: e.stack,
                    message: e.message
                }
            });
        }
    }
}

self.onmessage = Worker.interfacesController;

export default Worker;