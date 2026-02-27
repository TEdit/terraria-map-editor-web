import WorkerMessaging from "../WorkerMessaging.js";

export function finalizeUndo() {
    return WorkerMessaging.sendMessage("FINALIZE_UNDO", {});
}

export function performUndo() {
    return WorkerMessaging.sendMessage("UNDO", {});
}
