import WorkerMessaging from "../WorkerMessaging.js";

export default function({ onProgress }) {
    return WorkerMessaging.sendMessage("BLOCK_SWAP", {}, {
        callbacks: {
            onProgress
        }
    });
}