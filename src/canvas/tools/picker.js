/**
 * Picker / Eyedropper tool
 * Samples the tile/wall/liquid at the clicked position and sets it as the current selection
 */

import Main from "../main.js";
import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

const onPickerClick = async () => {
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
    const { tileData: tile } = await Main.workerInterfaces.getTileData(x, y);

    if (!tile) {
        console.warn("No tile data at position", x, y);
        return;
    }

    // Build complete tile edit options from sampled tile
    const newOptions = { ...Main.state.optionbar.tileEditOptions };

    // ALWAYS sample ALL properties regardless of current layer
    // This allows switching layers without losing picked properties

    // Always sample ALL block/tile properties
    if (tile.blockId !== undefined) {
        newOptions.blockId = tile.blockId;
        newOptions.editBlockId = true;  // blockId 0 (dirt) is valid, so always enable if defined
    } else {
        newOptions.blockId = 0;  // Default to 0 (dirt) when no block
        newOptions.editBlockId = false;  // No block, so uncheck "Modify"
    }

    // Sample tile paint color
    // Only enable paint flag if paint is actually set (not 0 or undefined or 31)
    if (tile.blockColor !== undefined && tile.blockColor !== 0 && tile.blockColor !== 31) {
        newOptions.blockColor = tile.blockColor;
        newOptions.editBlockColor = true;
    } else {
        newOptions.blockColor = 0;  // Reset to no paint
        newOptions.editBlockColor = false;
    }

    // Sample slope
    // Only enable slope flag if slope is not "full" (undefined or 0 means full/no slope)
    if (tile.slope !== undefined && tile.slope !== 0) {
        newOptions.slope = tile.slope;
        newOptions.editSlope = true;
    } else {
        newOptions.slope = undefined;  // Reset to full block (undefined = no slope)
        newOptions.editSlope = false;
    }

    // Sample block coatings
    // Only enable coating flags if coating is actually set
    newOptions.invisibleBlock = tile.invisibleBlock === true;
    newOptions.editInvisibleBlock = tile.invisibleBlock === true;

    newOptions.fullBrightBlock = tile.fullBrightBlock === true;
    newOptions.editFullBrightBlock = tile.fullBrightBlock === true;

    // Sample actuator properties
    // Only enable actuator flags if actuator is actually set
    newOptions.actuator = tile.actuator === true;
    newOptions.editActuator = tile.actuator === true;

    newOptions.actuated = tile.actuated === true;
    newOptions.editActuated = tile.actuated === true;

    // Always sample ALL wall properties
    if (tile.wallId !== undefined && tile.wallId > 0) {
        newOptions.wallId = tile.wallId;
        newOptions.editWallId = true;  // wallId > 0 means there's a wall
    } else {
        newOptions.wallId = 0;  // Default to 0 when no wall
        newOptions.editWallId = false;  // No wall (undefined or 0), so uncheck "Modify"
    }

    // Sample wall paint color
    // Only enable paint flag if paint is actually set (not 0 or undefined or 31)
    if (tile.wallColor !== undefined && tile.wallColor !== 0 && tile.wallColor !== 31) {
        newOptions.wallColor = tile.wallColor;
        newOptions.editWallColor = true;
    } else {
        newOptions.wallColor = 0;  // Reset to no paint
        newOptions.editWallColor = false;
    }

    // Sample wall coatings
    // Only enable coating flags if coating is actually set
    newOptions.invisibleWall = tile.invisibleWall === true;
    newOptions.editInvisibleWall = tile.invisibleWall === true;

    newOptions.fullBrightWall = tile.fullBrightWall === true;
    newOptions.editFullBrightWall = tile.fullBrightWall === true;

    // Sample liquid properties
    if (tile.liquidType !== undefined && tile.liquidAmount > 0) {
        newOptions.liquidType = tile.liquidType;
        newOptions.editLiquidType = true;
        newOptions.liquidAmount = tile.liquidAmount;
        newOptions.editLiquidAmount = true;
    } else {
        newOptions.liquidType = 1;  // Default to water
        newOptions.editLiquidType = false;
        newOptions.liquidAmount = 255;
        newOptions.editLiquidAmount = false;
    }

    // Determine sampledId for backward compatibility with optionbar.id
    // Priority: blockId > wallId > liquidType
    let sampledId = null;
    if (tile.blockId !== undefined && tile.blockId >= 0) {
        sampledId = tile.blockId;
    } else if (tile.wallId !== undefined && tile.wallId > 0) {
        sampledId = tile.wallId;
    } else if (tile.liquidType !== undefined && tile.liquidAmount > 0) {
        sampledId = tile.liquidType;
    }

    console.log("Picked comprehensive tile data:", {
        blockId: tile.blockId,
        blockPaintId: tile.blockPaintId,
        wallId: tile.wallId,
        wallPaintId: tile.wallPaintId,
        liquidType: tile.liquidType,
        slope: tile.slope,
        invisibleBlock: tile.invisibleBlock,
        fullBrightBlock: tile.fullBrightBlock,
        actuator: tile.actuator,
        actuated: tile.actuated,
        sampledId,
        tile
    });

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
