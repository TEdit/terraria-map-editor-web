import workerState from "../../workerState.js";
import { pushRegionUndo } from "./undo.js";

/**
 * Copy the selected region into the clipboard buffer.
 * Stores tiles as SoA typed arrays (column-major) plus chests, signs, and tile entities
 * with positions remapped to 0-based relative coordinates.
 */
export function copySelection(data, messageId) {
    const { x1, y1, x2, y2 } = data;
    const width = x2 - x1 + 1;
    const height = y2 - y1 + 1;
    const count = width * height;
    const srcTiles = workerState.worldObject.tiles;

    const clipboard = {
        width,
        height,
        tiles: {
            blockId: new Uint16Array(count),
            frameX: new Int16Array(count),
            frameY: new Int16Array(count),
            blockColor: new Uint8Array(count),
            wallId: new Uint16Array(count),
            wallColor: new Uint8Array(count),
            liquidAmount: new Uint8Array(count),
            liquidType: new Uint8Array(count),
            flags: new Uint16Array(count)
        },
        chests: [],
        signs: [],
        tileEntities: []
    };

    // Copy tile data (column-major layout matching TileData)
    for (let dx = 0; dx < width; dx++) {
        for (let dy = 0; dy < height; dy++) {
            const srcIdx = srcTiles.index(x1 + dx, y1 + dy);
            const dstIdx = dx * height + dy;
            clipboard.tiles.blockId[dstIdx] = srcTiles.blockId[srcIdx];
            clipboard.tiles.frameX[dstIdx] = srcTiles.frameX[srcIdx];
            clipboard.tiles.frameY[dstIdx] = srcTiles.frameY[srcIdx];
            clipboard.tiles.blockColor[dstIdx] = srcTiles.blockColor[srcIdx];
            clipboard.tiles.wallId[dstIdx] = srcTiles.wallId[srcIdx];
            clipboard.tiles.wallColor[dstIdx] = srcTiles.wallColor[srcIdx];
            clipboard.tiles.liquidAmount[dstIdx] = srcTiles.liquidAmount[srcIdx];
            clipboard.tiles.liquidType[dstIdx] = srcTiles.liquidType[srcIdx];
            clipboard.tiles.flags[dstIdx] = srcTiles.flags[srcIdx];
        }
    }

    // Copy chests in selection, remap positions to 0-based
    if (workerState.worldObject.chests?.chests) {
        clipboard.chests = workerState.worldObject.chests.chests
            .filter(c => c.position.x >= x1 && c.position.x <= x2 &&
                         c.position.y >= y1 && c.position.y <= y2)
            .map(c => ({
                ...structuredClone(c),
                position: { x: c.position.x - x1, y: c.position.y - y1 }
            }));
    }

    // Copy signs in selection
    if (workerState.worldObject.signs?.signs) {
        clipboard.signs = workerState.worldObject.signs.signs
            .filter(s => s.position.x >= x1 && s.position.x <= x2 &&
                         s.position.y >= y1 && s.position.y <= y2)
            .map(s => ({
                ...structuredClone(s),
                position: { x: s.position.x - x1, y: s.position.y - y1 }
            }));
    }

    // Copy tile entities in selection
    if (workerState.worldObject.tileEntities?.entities) {
        clipboard.tileEntities = workerState.worldObject.tileEntities.entities
            .filter(e => e.position.x >= x1 && e.position.x <= x2 &&
                         e.position.y >= y1 && e.position.y <= y2)
            .map(e => ({
                ...structuredClone(e),
                position: { x: e.position.x - x1, y: e.position.y - y1 }
            }));
    }

    workerState.clipboard = clipboard;

    postMessage({
        action: "RETURN_DONE",
        messageId,
        clipboardSize: { width, height }
    });
}

/**
 * Paste the clipboard buffer into the world at the given anchor position.
 * Returns updated tiles for rendering and full container arrays for main thread sync.
 */
export function pasteClipboard(data, messageId) {
    const { anchorX, anchorY } = data;
    const clipboard = workerState.clipboard;

    if (!clipboard) {
        postMessage({ action: "RETURN_EDIT_TILES", messageId, updatedTiles: [] });
        return;
    }

    const dstTiles = workerState.worldObject.tiles;
    const maxX = workerState.worldObject.header.maxTilesX;
    const maxY = workerState.worldObject.header.maxTilesY;
    const updatedTiles = [];

    // Snapshot the target region for undo before modifying
    const undoX1 = Math.max(0, anchorX);
    const undoY1 = Math.max(0, anchorY);
    const undoX2 = Math.min(maxX - 1, anchorX + clipboard.width - 1);
    const undoY2 = Math.min(maxY - 1, anchorY + clipboard.height - 1);
    if (undoX1 <= undoX2 && undoY1 <= undoY2) {
        pushRegionUndo(undoX1, undoY1, undoX2, undoY2);
    }

    // Paste tile data
    for (let dx = 0; dx < clipboard.width; dx++) {
        for (let dy = 0; dy < clipboard.height; dy++) {
            const worldX = anchorX + dx;
            const worldY = anchorY + dy;
            if (worldX < 0 || worldX >= maxX || worldY < 0 || worldY >= maxY) continue;

            const srcIdx = dx * clipboard.height + dy;
            const dstIdx = dstTiles.index(worldX, worldY);

            dstTiles.blockId[dstIdx] = clipboard.tiles.blockId[srcIdx];
            dstTiles.frameX[dstIdx] = clipboard.tiles.frameX[srcIdx];
            dstTiles.frameY[dstIdx] = clipboard.tiles.frameY[srcIdx];
            dstTiles.blockColor[dstIdx] = clipboard.tiles.blockColor[srcIdx];
            dstTiles.wallId[dstIdx] = clipboard.tiles.wallId[srcIdx];
            dstTiles.wallColor[dstIdx] = clipboard.tiles.wallColor[srcIdx];
            dstTiles.liquidAmount[dstIdx] = clipboard.tiles.liquidAmount[srcIdx];
            dstTiles.liquidType[dstIdx] = clipboard.tiles.liquidType[srcIdx];
            dstTiles.flags[dstIdx] = clipboard.tiles.flags[srcIdx];

            updatedTiles.push({ x: worldX, y: worldY, tile: dstTiles.getTile(worldX, worldY) });
        }
    }

    // Paste chests: remap to world coords, replace conflicts
    if (clipboard.chests.length > 0 && workerState.worldObject.chests?.chests) {
        clipboard.chests.forEach(c => {
            const wx = c.position.x + anchorX;
            const wy = c.position.y + anchorY;
            if (wx < 0 || wx >= maxX || wy < 0 || wy >= maxY) return;

            workerState.worldObject.chests.chests =
                workerState.worldObject.chests.chests.filter(
                    ec => ec.position.x !== wx || ec.position.y !== wy
                );
            workerState.worldObject.chests.chests.push({
                ...structuredClone(c),
                position: { x: wx, y: wy }
            });
        });
    }

    // Paste signs
    if (clipboard.signs.length > 0 && workerState.worldObject.signs?.signs) {
        clipboard.signs.forEach(s => {
            const wx = s.position.x + anchorX;
            const wy = s.position.y + anchorY;
            if (wx < 0 || wx >= maxX || wy < 0 || wy >= maxY) return;

            workerState.worldObject.signs.signs =
                workerState.worldObject.signs.signs.filter(
                    es => es.position.x !== wx || es.position.y !== wy
                );
            workerState.worldObject.signs.signs.push({
                ...structuredClone(s),
                position: { x: wx, y: wy }
            });
        });
    }

    // Paste tile entities
    if (clipboard.tileEntities.length > 0 && workerState.worldObject.tileEntities?.entities) {
        clipboard.tileEntities.forEach(e => {
            const wx = e.position.x + anchorX;
            const wy = e.position.y + anchorY;
            if (wx < 0 || wx >= maxX || wy < 0 || wy >= maxY) return;

            workerState.worldObject.tileEntities.entities =
                workerState.worldObject.tileEntities.entities.filter(
                    ee => ee.position.x !== wx || ee.position.y !== wy
                );
            workerState.worldObject.tileEntities.entities.push({
                ...structuredClone(e),
                position: { x: wx, y: wy }
            });
        });
    }

    postMessage({
        action: "RETURN_EDIT_TILES",
        messageId,
        updatedTiles,
        chests: workerState.worldObject.chests?.chests || [],
        signs: workerState.worldObject.signs?.signs || [],
        tileEntities: workerState.worldObject.tileEntities?.entities || []
    });
}

/**
 * Clear all tile data and remove containers in the selected region.
 * Returns updated tiles for rendering and full container arrays for main thread sync.
 */
export function clearSelection(data, messageId) {
    const { x1, y1, x2, y2 } = data;
    const tiles = workerState.worldObject.tiles;
    const updatedTiles = [];

    // Snapshot the region for undo before clearing
    pushRegionUndo(x1, y1, x2, y2);

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
            const i = tiles.index(x, y);
            tiles.blockId[i] = 0;
            tiles.frameX[i] = 0;
            tiles.frameY[i] = 0;
            tiles.blockColor[i] = 0;
            tiles.wallId[i] = 0;
            tiles.wallColor[i] = 0;
            tiles.liquidAmount[i] = 0;
            tiles.liquidType[i] = 0;
            tiles.flags[i] = 0;

            updatedTiles.push({ x, y, tile: tiles.getTile(x, y) });
        }
    }

    // Remove containers in the cleared area
    if (workerState.worldObject.chests?.chests) {
        workerState.worldObject.chests.chests =
            workerState.worldObject.chests.chests.filter(
                c => c.position.x < x1 || c.position.x > x2 ||
                     c.position.y < y1 || c.position.y > y2
            );
    }

    if (workerState.worldObject.signs?.signs) {
        workerState.worldObject.signs.signs =
            workerState.worldObject.signs.signs.filter(
                s => s.position.x < x1 || s.position.x > x2 ||
                     s.position.y < y1 || s.position.y > y2
            );
    }

    if (workerState.worldObject.tileEntities?.entities) {
        workerState.worldObject.tileEntities.entities =
            workerState.worldObject.tileEntities.entities.filter(
                e => e.position.x < x1 || e.position.x > x2 ||
                     e.position.y < y1 || e.position.y > y2
            );
    }

    postMessage({
        action: "RETURN_EDIT_TILES",
        messageId,
        updatedTiles,
        chests: workerState.worldObject.chests?.chests || [],
        signs: workerState.worldObject.signs?.signs || [],
        tileEntities: workerState.worldObject.tileEntities?.entities || []
    });
}
