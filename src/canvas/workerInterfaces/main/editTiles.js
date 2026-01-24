import WorkerMessaging from "../WorkerMessaging.js";

export default function(LAYER, editType, editArgs, newId, radius, tileEditOptions) {
    return WorkerMessaging.sendMessage("EDIT_TILES", {
        LAYER,
        editType,
        editArgs,
        newId,
        radius,  // Optional: undefined = infinite fill
        tileEditOptions  // Optional: property-based editing options
    });
}