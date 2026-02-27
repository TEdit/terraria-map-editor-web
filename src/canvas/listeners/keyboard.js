import Main from "../main.js";
import LAYERS from "../../utils/dbs/LAYERS.js";
import { copySelection, pasteClipboard, clearSelection } from "../workerInterfaces/main/clipboard.js";
import { performUndo } from "../workerInterfaces/main/undo.js";
import { renderFromWorldData } from "../../utils/colorApplication.js";

/**
 * Re-render all 7 layers for the given updated tiles from worker response.
 */
function renderAllLayers(updatedTiles) {
    if (!updatedTiles || updatedTiles.length === 0) return;

    const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
    const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

    // Build tilesData lookup and coordinate array from worker response
    const tilesData = {};
    const tilesArray = [];
    updatedTiles.forEach(({ x, y, tile }) => {
        tilesData[`${x},${y}`] = tile;
        tilesArray.push([x, y]);
    });

    // Calculate dirty rect from tile coordinates
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    tilesArray.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
    });
    const dirtyRect = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };

    // Re-render every tile-based layer for the affected area
    // BACKGROUND is skipped — it's a static gradient rendered once by the worker
    Object.values(LAYERS).forEach(layer => {
        if (layer === LAYERS.BACKGROUND) return;
        renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);
        Main.updateLayers(layer, dirtyRect);
    });
}

/**
 * Sync container data from worker response back to main thread state.
 */
function syncContainers(response) {
    if (response.chests && Main.state.canvas.worldObject.chests) {
        Main.state.canvas.worldObject.chests.chests = response.chests;
    }
    if (response.signs && Main.state.canvas.worldObject.signs) {
        Main.state.canvas.worldObject.signs.signs = response.signs;
    }
    if (response.tileEntities && Main.state.canvas.worldObject.tileEntities) {
        Main.state.canvas.worldObject.tileEntities.entities = response.tileEntities;
    }
}

export default function onKeyDown(e) {
    if (!Main.state?.canvas?.running) return;

    const isCtrl = e.ctrlKey || e.metaKey;

    // Ctrl+C: Copy selection
    if (isCtrl && e.key === "c") {
        const sel = Main.state.selection;
        if (!sel?.active) return;

        e.preventDefault();
        copySelection(sel).catch(err => console.error("Copy failed:", err));
    }

    // Ctrl+X: Cut (copy + clear)
    else if (isCtrl && e.key === "x") {
        const sel = Main.state.selection;
        if (!sel?.active) return;

        e.preventDefault();
        copySelection(sel)
            .then(() => clearSelection(sel))
            .then(response => {
                renderAllLayers(response.updatedTiles);
                syncContainers(response);
            })
            .catch(err => console.error("Cut failed:", err));
    }

    // Ctrl+V: Paste at mouse position
    else if (isCtrl && e.key === "v") {
        const anchorX = Main.mousePosImageX;
        const anchorY = Main.mousePosImageY;
        if (anchorX === undefined || anchorY === undefined) return;

        e.preventDefault();
        pasteClipboard(anchorX, anchorY)
            .then(response => {
                renderAllLayers(response.updatedTiles);
                syncContainers(response);
            })
            .catch(err => console.error("Paste failed:", err));
    }

    // Ctrl+Z: Undo
    else if (isCtrl && e.key === "z") {
        e.preventDefault();
        performUndo()
            .then(response => {
                renderAllLayers(response.updatedTiles);
                if (response.chests || response.signs || response.tileEntities) {
                    syncContainers(response);
                }
            })
            .catch(err => console.error("Undo failed:", err));
    }

    // Delete: Clear selection (no copy)
    else if (e.key === "Delete") {
        const sel = Main.state.selection;
        if (!sel?.active) return;

        e.preventDefault();
        clearSelection(sel)
            .then(response => {
                renderAllLayers(response.updatedTiles);
                syncContainers(response);
            })
            .catch(err => console.error("Delete failed:", err));
    }
}
