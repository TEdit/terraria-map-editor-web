import workerState from "../../workerState.js";

const MAX_UNDO = 50;

/**
 * Save a tile's current state before modifying it.
 * Only saves if this tile hasn't been saved yet in the current pending group.
 */
export function saveTileBeforeState(x, y) {
    const key = `${x},${y}`;
    if (workerState.pendingUndoTiles[key]) return;

    const tiles = workerState.worldObject.tiles;
    const i = tiles.index(x, y);
    workerState.pendingUndoTiles[key] = {
        blockId: tiles.blockId[i],
        frameX: tiles.frameX[i],
        frameY: tiles.frameY[i],
        blockColor: tiles.blockColor[i],
        wallId: tiles.wallId[i],
        wallColor: tiles.wallColor[i],
        liquidAmount: tiles.liquidAmount[i],
        liquidType: tiles.liquidType[i],
        flags: tiles.flags[i]
    };
}

/**
 * Finalize the pending undo group and push it to the stack.
 * Called after a complete operation (click, stroke end, bucket fill).
 */
export function finalizeUndo(messageId) {
    const keys = Object.keys(workerState.pendingUndoTiles);
    if (keys.length > 0) {
        workerState.undoStack.push({
            tiles: workerState.pendingUndoTiles,
            containers: null
        });
        workerState.pendingUndoTiles = {};
        if (workerState.undoStack.length > MAX_UNDO) {
            workerState.undoStack.shift();
        }
    }

    postMessage({ action: "RETURN_DONE", messageId });
}

/**
 * Snapshot a rectangular region and containers, then push as an atomic undo entry.
 * Used by clipboard paste/clear operations.
 */
export function pushRegionUndo(x1, y1, x2, y2) {
    // First finalize any pending drawing undo
    const pendingKeys = Object.keys(workerState.pendingUndoTiles);
    if (pendingKeys.length > 0) {
        workerState.undoStack.push({
            tiles: workerState.pendingUndoTiles,
            containers: null
        });
        workerState.pendingUndoTiles = {};
    }

    const tiles = workerState.worldObject.tiles;
    const savedTiles = {};

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
            const i = tiles.index(x, y);
            savedTiles[`${x},${y}`] = {
                blockId: tiles.blockId[i],
                frameX: tiles.frameX[i],
                frameY: tiles.frameY[i],
                blockColor: tiles.blockColor[i],
                wallId: tiles.wallId[i],
                wallColor: tiles.wallColor[i],
                liquidAmount: tiles.liquidAmount[i],
                liquidType: tiles.liquidType[i],
                flags: tiles.flags[i]
            };
        }
    }

    const containers = {
        chests: workerState.worldObject.chests?.chests
            ? structuredClone(workerState.worldObject.chests.chests) : [],
        signs: workerState.worldObject.signs?.signs
            ? structuredClone(workerState.worldObject.signs.signs) : [],
        tileEntities: workerState.worldObject.tileEntities?.entities
            ? structuredClone(workerState.worldObject.tileEntities.entities) : []
    };

    workerState.undoStack.push({ tiles: savedTiles, containers });
    if (workerState.undoStack.length > MAX_UNDO) {
        workerState.undoStack.shift();
    }
}

/**
 * Pop the most recent undo entry and restore tiles/containers.
 * Returns updatedTiles for rendering and container data for main thread sync.
 */
export function performUndo(data, messageId) {
    // Finalize any pending drawing undo first
    const pendingKeys = Object.keys(workerState.pendingUndoTiles);
    if (pendingKeys.length > 0) {
        workerState.undoStack.push({
            tiles: workerState.pendingUndoTiles,
            containers: null
        });
        workerState.pendingUndoTiles = {};
    }

    if (workerState.undoStack.length === 0) {
        postMessage({ action: "RETURN_EDIT_TILES", messageId, updatedTiles: [] });
        return;
    }

    const entry = workerState.undoStack.pop();
    const tiles = workerState.worldObject.tiles;
    const updatedTiles = [];

    for (const [key, saved] of Object.entries(entry.tiles)) {
        const [x, y] = key.split(",").map(Number);
        const i = tiles.index(x, y);
        tiles.blockId[i] = saved.blockId;
        tiles.frameX[i] = saved.frameX;
        tiles.frameY[i] = saved.frameY;
        tiles.blockColor[i] = saved.blockColor;
        tiles.wallId[i] = saved.wallId;
        tiles.wallColor[i] = saved.wallColor;
        tiles.liquidAmount[i] = saved.liquidAmount;
        tiles.liquidType[i] = saved.liquidType;
        tiles.flags[i] = saved.flags;

        updatedTiles.push({ x, y, tile: tiles.getTile(x, y) });
    }

    // Restore containers if present
    if (entry.containers) {
        if (workerState.worldObject.chests) {
            workerState.worldObject.chests.chests = entry.containers.chests;
        }
        if (workerState.worldObject.signs) {
            workerState.worldObject.signs.signs = entry.containers.signs;
        }
        if (workerState.worldObject.tileEntities) {
            workerState.worldObject.tileEntities.entities = entry.containers.tileEntities;
        }
    }

    postMessage({
        action: "RETURN_EDIT_TILES",
        messageId,
        updatedTiles,
        chests: entry.containers ? workerState.worldObject.chests?.chests || [] : undefined,
        signs: entry.containers ? workerState.worldObject.signs?.signs || [] : undefined,
        tileEntities: entry.containers ? workerState.worldObject.tileEntities?.entities || [] : undefined
    });
}
