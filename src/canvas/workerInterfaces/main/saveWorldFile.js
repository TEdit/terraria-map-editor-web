import WorkerMessaging from "../WorkerMessaging.js";

export default function({ worldObject, onSaveStart, onSaveProgress }) {
    return WorkerMessaging.sendMessage("SAVE_WORLD_FILE", {
        worldObject
    }, {
        callbacks: {
            onSaveStart,
            onSaveProgress
        }
    });
}