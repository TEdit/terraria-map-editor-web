import Main from "../main.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

import { applyColorToTiles } from "../../utils/colorApplication.js";

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

        // If flood fill returned tiles, apply colors to canvas and render
        if (response?.tilesArray && response.tilesArray.length > 0) {
            // Apply colors to layer image data
            applyColorToTiles(response.tilesArray, layer, id, maxTilesX, maxTilesY);

            // Trigger canvas render update
            Main.updateLayers(layer);
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
