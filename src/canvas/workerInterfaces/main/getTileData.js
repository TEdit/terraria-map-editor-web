import WorkerMessaging from "../WorkerMessaging.js";

export default function(x, y) {
    return WorkerMessaging.sendMessage("GET_TILE_DATA", {
        x,
        y
    });
}