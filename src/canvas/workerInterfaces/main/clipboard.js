import WorkerMessaging from "../WorkerMessaging.js";

export function copySelection(selection) {
    return WorkerMessaging.sendMessage("COPY_SELECTION", {
        x1: selection.x1,
        y1: selection.y1,
        x2: selection.x2,
        y2: selection.y2
    });
}

export function pasteClipboard(anchorX, anchorY) {
    return WorkerMessaging.sendMessage("PASTE_CLIPBOARD", {
        anchorX,
        anchorY
    });
}

export function clearSelection(selection) {
    return WorkerMessaging.sendMessage("CLEAR_SELECTION", {
        x1: selection.x1,
        y1: selection.y1,
        x2: selection.x2,
        y2: selection.y2
    });
}
