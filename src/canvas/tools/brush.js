import Main from "../main.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

import { drawLine, fillEllipseCentered, fillRectangleCentered, deduplicateTiles } from "../../utils/geometry/index.js";
import { isInSelection } from "../../utils/selection.js";
import { applyColorToTiles } from "../../utils/colorApplication.js";

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

    applyColorToTiles(tilesArray, layer, Main.state.optionbar.id, maxTilesX, maxTilesY);

    Main.updateLayers(layer);

    await Main.workerInterfaces.editTiles(
        layer,
        "rectangle",
        [tilesArray[0], tilesArray[tilesArray.length - 1]],
        Main.state.optionbar.id,
        undefined,  // radius (not used for brush)
        Main.state.optionbar.tileEditOptions  // Pass tile editing options
    );

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

    applyColorToTiles(tilesArray, layer, Main.state.optionbar.id, maxTilesX, maxTilesY);

    Main.updateLayers(layer);

    await Main.workerInterfaces.editTiles(
        layer,
        "rectangle",
        [tilesArray[0], tilesArray[tilesArray.length - 1]],
        Main.state.optionbar.id,
        undefined,  // radius (not used for brush)
        Main.state.optionbar.tileEditOptions  // Pass tile editing options
    );

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
