import Main from "../main.js";
import LAYERS from "../../utils/dbs/LAYERS.js";

import { onDrawingToolClick, onDrawingToolDrag, onDrawingToolUp } from "./drawingToolsHelpers.js";
import { applyColorToTiles } from "../../utils/colorApplication.js";

/**
 * Apply color to tiles array
 * Handles special cases: rainbow brick (ID 160) and checkerboard (ID 51)
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

        // Use shared color application utility
        applyColorToTiles(
            tilesArray,
            layer,
            Main.state.optionbar.id,
            maxTilesX,
            maxTilesY,
            Main.state.optionbar.tileEditOptions
        );

        Main.updateLayers(layer);

        // Update paint layer if normal paint is active
        if (Main.state.optionbar.tileEditOptions) {
            const opts = Main.state.optionbar.tileEditOptions;
            const isTiles = layer === LAYERS.TILES;
            const isWalls = layer === LAYERS.WALLS;
            const paintId = isTiles ? opts.blockColor : isWalls ? opts.wallColor : null;
            const paintEnabled = isTiles ? opts.editBlockColor : isWalls ? opts.editWallColor : false;

            if (paintEnabled && paintId && paintId !== 0 && paintId !== 31 && paintId !== 29 && paintId !== 30) {
                const paintLayer = isTiles ? LAYERS.TILEPAINT : LAYERS.WALLPAINT;
                Main.updateLayers(paintLayer);
            }
        }

        // Notify worker of changes
        if (tilesArray.length > 0) {
            await Main.workerInterfaces.editTiles(
                layer,
                "rectangle",
                [tilesArray[0], tilesArray[tilesArray.length - 1]],
                Main.state.optionbar.id,
                undefined,  // radius (not used for pencil)
                Main.state.optionbar.tileEditOptions  // Pass tile editing options
            );
        }
    } catch (error) {
        console.error("Error in pencil operation:", error);
    }
}

const onPencilClick = async (e) => {
    await onDrawingToolClick(applyPencilOperation);
}

const onPencilDrag = async (e) => {
    await onDrawingToolDrag(applyPencilOperation);
}

const onPencilUp = onDrawingToolUp;

export {
    onPencilClick,
    onPencilDrag,
    onPencilUp
}
