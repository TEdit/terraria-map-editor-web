import Worker from "../../worker.js";

export default function(data, messageId) {
    const { x, y } = data;

    postMessage({
        action: "RETURN_TILE_DATA",
        messageId,
        tileData: Worker.worldObject.tiles[x][y]
    });
}