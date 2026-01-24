import Main from "../main.js";

import LAYERS from "../../utils/dbs/LAYERS.js";

import { onDrawingToolClick, onDrawingToolDrag, onDrawingToolUp } from "./drawingToolsHelpers.js";

/**
 * Erase tiles by clearing all layer data (RGBA = 0)
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
        let offset;
        let allLayers = [
            LAYERS.TILES,
            LAYERS.TILEPAINT,
            LAYERS.WALLS,
            LAYERS.WALLPAINT,
            LAYERS.WIRES,
            LAYERS.LIQUIDS
        ];

        if (layer == 100) {
            // 100 = erase all layers
            tilesArray.forEach(([x, y]) => {
                allLayers.forEach(LAYER => {
                    offset = (maxTilesX * y + x) * 4;
                    Main.layersImages[LAYER].data[offset] = 0;
                    Main.layersImages[LAYER].data[offset+1] = 0;
                    Main.layersImages[LAYER].data[offset+2] = 0;
                    Main.layersImages[LAYER].data[offset+3] = 0;
                });
            });
            Main.updateLayers();
        } else if (layer === LAYERS.TILES || layer === LAYERS.TILEPAINT) {
            // Erase both tile and painted tile layers
            tilesArray.forEach(([x, y]) => {
                offset = (maxTilesX * y + x) * 4;
                Main.layersImages[LAYERS.TILES].data[offset] = 0;
                Main.layersImages[LAYERS.TILES].data[offset+1] = 0;
                Main.layersImages[LAYERS.TILES].data[offset+2] = 0;
                Main.layersImages[LAYERS.TILES].data[offset+3] = 0;
                Main.layersImages[LAYERS.TILEPAINT].data[offset] = 0;
                Main.layersImages[LAYERS.TILEPAINT].data[offset+1] = 0;
                Main.layersImages[LAYERS.TILEPAINT].data[offset+2] = 0;
                Main.layersImages[LAYERS.TILEPAINT].data[offset+3] = 0;
            });
            Main.updateLayers(LAYERS.TILES);
            Main.updateLayers(LAYERS.TILEPAINT);
        } else if (layer === LAYERS.WALLS || layer === LAYERS.WALLPAINT) {
            // Erase both wall and painted wall layers
            tilesArray.forEach(([x, y]) => {
                offset = (maxTilesX * y + x) * 4;
                Main.layersImages[LAYERS.WALLS].data[offset] = 0;
                Main.layersImages[LAYERS.WALLS].data[offset+1] = 0;
                Main.layersImages[LAYERS.WALLS].data[offset+2] = 0;
                Main.layersImages[LAYERS.WALLS].data[offset+3] = 0;
                Main.layersImages[LAYERS.WALLPAINT].data[offset] = 0;
                Main.layersImages[LAYERS.WALLPAINT].data[offset+1] = 0;
                Main.layersImages[LAYERS.WALLPAINT].data[offset+2] = 0;
                Main.layersImages[LAYERS.WALLPAINT].data[offset+3] = 0;
            });
            Main.updateLayers(LAYERS.WALLS);
            Main.updateLayers(LAYERS.WALLPAINT);
        } else {
            // Erase specific layer (wires, liquids, etc.)
            tilesArray.forEach(([x, y]) => {
                offset = (maxTilesX * y + x) * 4;
                Main.layersImages[layer].data[offset] = 0;
                Main.layersImages[layer].data[offset+1] = 0;
                Main.layersImages[layer].data[offset+2] = 0;
                Main.layersImages[layer].data[offset+3] = 0;
            });
            Main.updateLayers(layer);
        }

        // Notify worker of changes
        if (tilesArray.length > 0) {
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

            await Main.workerInterfaces.editTiles(
                layer,
                "rectangle",
                [tilesArray[0], tilesArray[tilesArray.length - 1]],
                "delete",
                undefined,  // radius (not used for eraser)
                eraserOptions
            );
        }
    } catch (error) {
        console.error("Error in eraser operation:", error);
    }
}

const onEraserClick = async (e) => {
    await onDrawingToolClick(applyEraserOperation);
}

const onEraserDrag = async (e) => {
    await onDrawingToolDrag(applyEraserOperation);
}

const onEraserUp = onDrawingToolUp;

export {
    onEraserClick,
    onEraserDrag,
    onEraserUp
}
