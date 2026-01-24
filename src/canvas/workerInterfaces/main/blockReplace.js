import WorkerMessaging from "../WorkerMessaging.js";

export default function({ from, to, onProgress }) {
    return WorkerMessaging.sendMessage("BLOCK_REPLACE", {
        from,
        to
    }, {
        callbacks: {
            onProgress
        }
    });
}