/**
 * Picker / Eyedropper tool
 * Samples the tile/wall/liquid at the clicked position and sets it as the current selection
 */

import Main from "../main.js";
import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";
import LAYERS from "../../utils/dbs/LAYERS.js";

const onPickerClick = async (e) => {
    // Get the clicked position
    const x = Main.mousePosImageX;
    const y = Main.mousePosImageY;

    // Validate position is within map bounds
    const maxX = Main.state.canvas?.worldObject?.header?.maxTilesX;
    const maxY = Main.state.canvas?.worldObject?.header?.maxTilesY;

    if (!maxX || !maxY || x < 0 || y < 0 || x >= maxX || y >= maxY) {
        console.warn("Picker click outside map bounds");
        return;
    }

    // Get the tile data from the worker
    const tile = await Main.workerInterfaces.getTileData(x, y);

    if (!tile) {
        console.warn("No tile data at position", x, y);
        return;
    }

    // Get current layer from optionbar
    const currentLayer = Main.state.optionbar.layer;

    // Build complete tile edit options from sampled tile
    const newOptions = { ...Main.state.optionbar.tileEditOptions };

    // Sample the appropriate property based on current layer
    let sampledId = null;

    switch (currentLayer) {
        case LAYERS.TILES:
            // Sample tile ID
            if (tile.blockId !== undefined) {
                sampledId = tile.blockId;
                newOptions.blockId = tile.blockId;
                newOptions.editBlockId = true;

                // Sample tile paint color
                if (tile.blockColor !== undefined) {
                    newOptions.blockColor = tile.blockColor;
                    newOptions.editBlockColor = true;
                } else {
                    newOptions.blockColor = 0;
                    newOptions.editBlockColor = false;
                }

                // Sample slope
                if (tile.slope !== undefined) {
                    newOptions.slope = tile.slope;
                    newOptions.editSlope = true;
                } else {
                    newOptions.slope = undefined;
                    newOptions.editSlope = false;
                }

                // Sample block coatings
                if (tile.invisibleBlock) {
                    newOptions.invisibleBlock = true;
                    newOptions.editInvisibleBlock = true;
                } else {
                    newOptions.invisibleBlock = false;
                    newOptions.editInvisibleBlock = false;
                }

                if (tile.fullBrightBlock) {
                    newOptions.fullBrightBlock = true;
                    newOptions.editFullBrightBlock = true;
                } else {
                    newOptions.fullBrightBlock = false;
                    newOptions.editFullBrightBlock = false;
                }

                // Sample actuator properties
                if (tile.actuator) {
                    newOptions.actuator = true;
                    newOptions.editActuator = true;
                } else {
                    newOptions.actuator = false;
                    newOptions.editActuator = false;
                }

                if (tile.actuated) {
                    newOptions.actuated = true;
                    newOptions.editActuated = true;
                } else {
                    newOptions.actuated = false;
                    newOptions.editActuated = false;
                }

                console.log("Picked tile:", sampledId, tile);
            } else {
                console.log("No tile at this position");
            }
            break;

        case LAYERS.WALLS:
            // Sample wall ID
            if (tile.wallId !== undefined) {
                sampledId = tile.wallId;
                newOptions.wallId = tile.wallId;
                newOptions.editWallId = true;

                // Sample wall paint color
                if (tile.wallColor !== undefined) {
                    newOptions.wallColor = tile.wallColor;
                    newOptions.editWallColor = true;
                } else {
                    newOptions.wallColor = 0;
                    newOptions.editWallColor = false;
                }

                // Sample wall coatings
                if (tile.invisibleWall) {
                    newOptions.invisibleWall = true;
                    newOptions.editInvisibleWall = true;
                } else {
                    newOptions.invisibleWall = false;
                    newOptions.editInvisibleWall = false;
                }

                if (tile.fullBrightWall) {
                    newOptions.fullBrightWall = true;
                    newOptions.editFullBrightWall = true;
                } else {
                    newOptions.fullBrightWall = false;
                    newOptions.editFullBrightWall = false;
                }

                console.log("Picked wall:", sampledId, tile);
            } else {
                console.log("No wall at this position");
            }
            break;

        case LAYERS.LIQUIDS:
            sampledId = tile.liquidType;
            if (sampledId !== undefined && tile.liquidAmount > 0) {
                console.log("Picked liquid:", sampledId);
            } else {
                console.log("No liquid at this position");
            }
            break;

        case LAYERS["Painted Tiles"]:
            sampledId = tile.blockColor;
            if (sampledId !== undefined) {
                newOptions.blockColor = tile.blockColor;
                newOptions.editBlockColor = true;
                newOptions.editBlockId = false;  // Only paint, not tile ID
                console.log("Picked tile paint:", sampledId);
            } else {
                console.log("No tile paint at this position");
            }
            break;

        case LAYERS["Painted Walls"]:
            sampledId = tile.wallColor;
            if (sampledId !== undefined) {
                newOptions.wallColor = tile.wallColor;
                newOptions.editWallColor = true;
                newOptions.editWallId = false;  // Only paint, not wall ID
                console.log("Picked wall paint:", sampledId);
            } else {
                console.log("No wall paint at this position");
            }
            break;

        default:
            console.warn("Picker not supported for layer:", currentLayer);
    }

    // Update both the ID (for backward compatibility) and tileEditOptions
    if (sampledId !== null && sampledId !== undefined) {
        store.dispatch(stateChange([
            [["optionbar", "id"], sampledId],
            [["optionbar", "tileEditOptions"], newOptions]
        ]));
    }
};

export {
    onPickerClick
};
