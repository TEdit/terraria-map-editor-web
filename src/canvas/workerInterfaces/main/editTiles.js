import WorkerMessaging from "../WorkerMessaging.js";

export default function(tileEditOptions) {
    return WorkerMessaging.sendMessage("EDIT_TILES", tileEditOptions);
}