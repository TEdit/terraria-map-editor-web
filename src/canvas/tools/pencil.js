import Main from "../main.js";
import LAYERS from "../../utils/dbs/LAYERS.js";

import { onDrawingToolClick, onDrawingToolDrag, onDrawingToolUp, calculateDirtyRect } from "./drawingToolsHelpers.js";
import { renderFromWorldData } from "../../utils/colorApplication.js";

/**
 * Unified pipeline: Edit world data first, then render from updated data
 * Uses the actual line-interpolated tiles array (not rectangle corners)
 * Tiles stay in worker to save memory - we render from worker response
 */
async function applyPencilOperation(tilesArray, layer) {
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

        // PHASE 2 UNIFIED PIPELINE (Memory Efficient):
        // 1. Edit world data in worker (wait for completion)
        const response = await Main.workerInterfaces.editTiles({
            ...Main.state.optionbar.tileEditOptions,
            editType: "tileslist",
            tileEditArgs: tilesArray,
            layer: layer
        });

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

        const opts = Main.state.optionbar.tileEditOptions;
        const isTiles = layer === LAYERS.TILES;
        const isWalls = layer === LAYERS.WALLS;

        // Placing a block clears liquid when overwriteLiquids is on — re-render LIQUIDS layer
        if (isTiles && opts?.editBlockId && opts.blockId !== "delete" && opts.blockId !== null && opts.overwriteLiquids !== false) {
            renderFromWorldData(tilesArray, LAYERS.LIQUIDS, maxTilesX, maxTilesY, tilesData);
            Main.updateLayers(LAYERS.LIQUIDS, dirtyRect);
        }

        // Update paint layer if normal paint is active
        if (opts) {
            const paintId = isTiles ? opts.blockColor : isWalls ? opts.wallColor : null;
            const paintEnabled = isTiles ? opts.editBlockColor : isWalls ? opts.editWallColor : false;

            if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
                const paintLayer = isTiles ? LAYERS.TILEPAINT : LAYERS.WALLPAINT;
                Main.updateLayers(paintLayer, dirtyRect);
            }
        }
    } catch (error) {
        console.error("Error in pencil operation:", error);
    }
}

const onPencilClick = async (_e) => {
    await onDrawingToolClick(applyPencilOperation);
}

const onPencilDrag = async (_e) => {
    await onDrawingToolDrag(applyPencilOperation);
}

const onPencilUp = (_e) => {
    onDrawingToolUp(_e, applyPencilOperation, Main.state.optionbar.layer);
};

export {
    onPencilClick,
    onPencilDrag,
    onPencilUp
}
