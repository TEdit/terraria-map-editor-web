import Main from "../main.js";
import LAYERS from "../../utils/dbs/LAYERS.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

import { drawLine, fillEllipseCentered, fillRectangleCentered, deduplicateTiles } from "../../utils/geometry/index.js";
import { isInSelection } from "../../utils/selection.js";
import { renderFromWorldData } from "../../utils/colorApplication.js";
import { calculateDirtyRect } from "./drawingToolsHelpers.js";

/**
 * Get brush tiles based on shape and size
 */
function getBrushTiles(center, size, shape) {
    const [width, height] = Array.isArray(size) ? size : [size, size];

    if (shape === "ellipse") {
        return fillEllipseCentered(
            center,
            {x: Math.floor(width/2), y: Math.floor(height/2)}
        ).map(p => [p.x, p.y]);
    } else {
        // Default: square/rectangle
        return fillRectangleCentered(
            center,
            {x: width, y: height}
        ).map(p => [p.x, p.y]);
    }
}

const onBrushClick = async (e) => {
    if (Main.listeners.dragging) {
        Main.listeners.dragging = false;
        return;
    }

    // Store starting position for next drag
    Main.listeners.brushStartX = Main.mousePosImageX;
    Main.listeners.brushStartY = Main.mousePosImageY;

    store.dispatch(stateChange(["status", "loading"], true));

    const shape = Main.state.optionbar.brushShape || "square";
    let tilesArray = getBrushTiles(
        {x: Main.mousePosImageX, y: Main.mousePosImageY},
        Main.state.optionbar.size,
        shape
    );

    const layer = Main.state.optionbar.layer;
    const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
    const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

    // Filter to respect selection if active
    tilesArray = tilesArray.filter(([x, y]) =>
        isInSelection(x, y, Main.state.selection)
    );

    // PHASE 2 UNIFIED PIPELINE:
    // 1. Edit world data FIRST (wait for completion)
    const response = await Main.workerInterfaces.editTiles(
        layer,
        "tileslist",  // Use tileslist mode for actual tiles
        tilesArray,   // Pass actual tiles, not rectangle corners
        Main.state.optionbar.id,
        undefined,    // radius (not used for brush)
        Main.state.optionbar.tileEditOptions
    );

    // 2. Build tiles lookup from worker response (no main thread copy)
    const tilesData = {};
    if (response.updatedTiles) {
        response.updatedTiles.forEach(({ x, y, tile }) => {
            tilesData[`${x},${y}`] = tile;
        });
    }

    // 3. Render from worker data
    renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);

    // Calculate dirty rectangle (only copy changed region to canvas)
    const dirtyRect = calculateDirtyRect(tilesArray);
    Main.updateLayers(layer, dirtyRect);

    // Update paint layer if normal paint is active
    if (Main.state.optionbar.tileEditOptions) {
        const opts = Main.state.optionbar.tileEditOptions;
        const isTiles = layer === LAYERS.TILES;
        const isWalls = layer === LAYERS.WALLS;
        const paintId = isTiles ? opts.blockColor : isWalls ? opts.wallColor : null;
        const paintEnabled = isTiles ? opts.editBlockColor : isWalls ? opts.editWallColor : false;

        if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
            const paintLayer = isTiles ? LAYERS.TILEPAINT : LAYERS.WALLPAINT;
            Main.updateLayers(paintLayer, dirtyRect);
        }
    }

    store.dispatch(stateChange(["status", "loading"], false));
}

const onBrushDrag = async (e) => {
    if (!Main.listeners.dragging)
        Main.listeners.dragging = true;

    store.dispatch(stateChange(["status", "loading"], true));

    // Interpolate line between previous and current position
    const linePoints = drawLine(
        {x: Main.listeners.brushStartX, y: Main.listeners.brushStartY},
        {x: Main.mousePosImageX, y: Main.mousePosImageY}
    );

    // Build tile array by stamping brush at each line point
    let tilesArray = [];
    const shape = Main.state.optionbar.brushShape || "square";
    const layer = Main.state.optionbar.layer;
    const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
    const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

    linePoints.forEach(point => {
        const brushTiles = getBrushTiles(point, Main.state.optionbar.size, shape);
        tilesArray.push(...brushTiles);
    });

    // Deduplicate to prevent double-painting
    tilesArray = deduplicateTiles(tilesArray);

    // Filter to respect selection if active
    tilesArray = tilesArray.filter(([x, y]) =>
        isInSelection(x, y, Main.state.selection)
    );

    // PHASE 2 UNIFIED PIPELINE:
    // 1. Edit world data FIRST (wait for completion)
    const response = await Main.workerInterfaces.editTiles(
        layer,
        "tileslist",  // Use tileslist mode for line-interpolated tiles
        tilesArray,   // Pass actual line tiles, not rectangle corners
        Main.state.optionbar.id,
        undefined,    // radius (not used for brush)
        Main.state.optionbar.tileEditOptions
    );

    // 2. Build tiles lookup from worker response (no main thread copy)
    const tilesData = {};
    if (response.updatedTiles) {
        response.updatedTiles.forEach(({ x, y, tile }) => {
            tilesData[`${x},${y}`] = tile;
        });
    }

    // 3. Render from worker data
    renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);

    // Calculate dirty rectangle (only copy changed region to canvas)
    const dirtyRect = calculateDirtyRect(tilesArray);
    Main.updateLayers(layer, dirtyRect);

    // Update paint layer if normal paint is active
    if (Main.state.optionbar.tileEditOptions) {
        const opts = Main.state.optionbar.tileEditOptions;
        const isTiles = layer === LAYERS.TILES;
        const isWalls = layer === LAYERS.WALLS;
        const paintId = isTiles ? opts.blockColor : isWalls ? opts.wallColor : null;
        const paintEnabled = isTiles ? opts.editBlockColor : isWalls ? opts.editWallColor : false;

        if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
            const paintLayer = isTiles ? LAYERS.TILEPAINT : LAYERS.WALLPAINT;
            Main.updateLayers(paintLayer, dirtyRect);
        }
    }

    // Update start position for next drag
    Main.listeners.brushStartX = Main.mousePosImageX;
    Main.listeners.brushStartY = Main.mousePosImageY;

    store.dispatch(stateChange(["status", "loading"], false));
}

const onBrushUp = (_e) => {
    Main.listeners.dragging = false;
}

export {
    onBrushClick,
    onBrushDrag,
    onBrushUp
}
