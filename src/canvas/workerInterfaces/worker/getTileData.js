import workerState from "../../workerState.js";

export default function(data, messageId) {
    const { x, y } = data;

    postMessage({
        action: "RETURN_TILE_DATA",
        messageId,
        tileData: workerState.worldObject.tiles.getTile(x, y)
    });
}
