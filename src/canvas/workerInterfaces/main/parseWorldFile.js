import WorkerMessaging from "../WorkerMessaging.js";

export default function({ worldFile, unsafe, unsafeOnlyTiles, ignoreBounds, onParseStart, onParseProgress }) {
    return WorkerMessaging.sendMessage("PARSE_WORLD_FILE", {
        worldFile,
        unsafe,
        unsafeOnlyTiles,
        ignoreBounds
    }, {
        callbacks: {
            onParseStart,
            onParseProgress
        }
    });
}