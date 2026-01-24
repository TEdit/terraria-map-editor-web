import WorkerMessaging from "../WorkerMessaging.js";

export default function({ onRenderingStart, onRenderingProgress, onRenderingDone, onDone }) {
    return WorkerMessaging.sendMessage("RENDER_LAYERS_IMAGES", {}, {
        callbacks: {
            onRenderingStart,
            onRenderingProgress,
            onRenderingDone
        }
    });
}