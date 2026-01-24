import Main from "../main.js";

import LAYERS from "../../utils/dbs/LAYERS.js";

import { onDrawingToolClick, onDrawingToolDrag, onDrawingToolUp, calculateDirtyRect } from "./drawingToolsHelpers.js";
import { renderFromWorldData } from "../../utils/colorApplication.js";

/**
 * Unified pipeline: Edit world data first (erase), then render from updated data
 */
async function applyEraserOperation(tilesArray, layer) {
    try {
        // Validate inputs
        if (!tilesArray || !Array.isArray(tilesArray) || tilesArray.length === 0) {
            return;
        }

        if (!Main.state?.canvas?.worldObject?.header) {
            console.warn("Canvas data missing");
            return;
        }

        if (!Main.layersImages?.[layer]?.data) {
            console.warn("Layer image data missing");
            return;
        }

        const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

        // Build eraser options to clear coatings as well
        const eraserOptions = {
            editBlockId: layer === LAYERS.TILES || layer === 100,
            blockId: "delete",

            editWallId: layer === LAYERS.WALLS || layer === 100,
            wallId: "delete",

            // Also clear coatings when erasing tiles
            editInvisibleBlock: layer === LAYERS.TILES || layer === 100,
            invisibleBlock: false,
            editFullBrightBlock: layer === LAYERS.TILES || layer === 100,
            fullBrightBlock: false,

            // Also clear coatings when erasing walls
            editInvisibleWall: layer === LAYERS.WALLS || layer === 100,
            invisibleWall: false,
            editFullBrightWall: layer === LAYERS.WALLS || layer === 100,
            fullBrightWall: false
        };

        // PHASE 2 UNIFIED PIPELINE:
        // 1. Edit world data FIRST (wait for completion)
        const response = await Main.workerInterfaces.editTiles(
            layer,
            "tileslist",  // Use tileslist mode for line-interpolated tiles
            tilesArray,   // Pass actual line tiles, not rectangle corners
            "delete",
            undefined,    // radius (not used for eraser)
            eraserOptions
        );

        // 2. Build tiles lookup from worker response (no main thread copy)
        const tilesData = {};
        if (response.updatedTiles) {
            response.updatedTiles.forEach(({ x, y, tile }) => {
                tilesData[`${x},${y}`] = tile;
            });
        }

        // 3. Render from worker data
        // Calculate dirty rectangle (only copy changed region to canvas)
        const dirtyRect = calculateDirtyRect(tilesArray);

        if (layer == 100) {
            // Erase all layers
            const allLayers = [LAYERS.TILES, LAYERS.WALLS, LAYERS.WIRES, LAYERS.LIQUIDS];
            allLayers.forEach(LAYER => {
                renderFromWorldData(tilesArray, LAYER, maxTilesX, maxTilesY, tilesData);
            });
            Main.updateLayers();  // Full update for "all layers" mode
        } else if (layer === LAYERS.TILES || layer === LAYERS.TILEPAINT) {
            // Erase tiles and paint
            renderFromWorldData(tilesArray, LAYERS.TILES, maxTilesX, maxTilesY, tilesData);
            Main.updateLayers(LAYERS.TILES, dirtyRect);
            Main.updateLayers(LAYERS.TILEPAINT, dirtyRect);
        } else if (layer === LAYERS.WALLS || layer === LAYERS.WALLPAINT) {
            // Erase walls and paint
            renderFromWorldData(tilesArray, LAYERS.WALLS, maxTilesX, maxTilesY, tilesData);
            Main.updateLayers(LAYERS.WALLS, dirtyRect);
            Main.updateLayers(LAYERS.WALLPAINT, dirtyRect);
        } else {
            // Erase specific layer
            renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);
            Main.updateLayers(layer, dirtyRect);
        }
    } catch (error) {
        console.error("Error in eraser operation:", error);
    }
}

const onEraserClick = async (_e) => {
    await onDrawingToolClick(applyEraserOperation);
}

const onEraserDrag = async (_e) => {
    await onDrawingToolDrag(applyEraserOperation);
}

const onEraserUp = (_e) => {
    onDrawingToolUp(_e, applyEraserOperation, Main.state.optionbar.layer);
};

export {
    onEraserClick,
    onEraserDrag,
    onEraserUp
}
