import Main from "../main.js";
import LAYERS from "../../utils/dbs/LAYERS.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

import { renderFromWorldData } from "../../utils/colorApplication.js";
import { calculateDirtyRect } from "./drawingToolsHelpers.js";

const onBucketClick = async (e) => {
    // Validate canvas state exists
    if (!Main.state?.canvas?.worldObject?.header) {
        console.warn("Canvas data missing - bucket fill aborted");
        return;
    }

    if (!Main.layersImages?.[Main.state.optionbar.layer]?.data) {
        console.warn("Layer image data missing - bucket fill aborted");
        return;
    }

    store.dispatch(stateChange(["status", "loading"], true));

    try {
        const layer = Main.state.optionbar.layer;
        const id = Main.state.optionbar.id;
        const maxTilesX = Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = Main.state.canvas.worldObject.header.maxTilesY;

        // Determine if radius should be applied
        // When selection is active, selection bounds constrain fill (no radius needed)
        // When selection is inactive, use radius from optionbar
        const radius = Main.state.selection?.active
            ? undefined  // Selection active: no radius limit
            : Main.state.optionbar.radius;  // Use radius setting

        // Call worker to perform flood fill on world data
        const response = await Main.workerInterfaces.editTiles(
            layer,
            "floodfill",
            [Main.mousePosImageX, Main.mousePosImageY],
            id,
            radius,  // Pass radius to worker (undefined = infinite fill)
            Main.state.optionbar.tileEditOptions  // Pass tile editing options
        );

        // If flood fill returned tiles, sync data and render
        if (response?.tilesArray && response.tilesArray.length > 0) {
            // PHASE 2 UNIFIED PIPELINE:
            // 1. Worker already edited data (flood fill completed)

            // 2. Build tiles lookup from worker response (no main thread copy)
            const tilesData = {};
            if (response.updatedTiles) {
                response.updatedTiles.forEach(({ x, y, tile }) => {
                    tilesData[`${x},${y}`] = tile;
                });
            }

            // 3. Render from worker data
            renderFromWorldData(
                response.tilesArray,
                layer,
                maxTilesX,
                maxTilesY,
                tilesData
            );

            // Calculate dirty rectangle (only copy changed region to canvas)
            const dirtyRect = calculateDirtyRect(response.tilesArray);

            // Trigger canvas render update
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
        }

    } catch (error) {
        console.error("Error in bucket fill:", error);
    } finally {
        store.dispatch(stateChange(["status", "loading"], false));
    }
}

export {
    onBucketClick
}
