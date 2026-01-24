import Worker from "../../worker.js";

import "../../../utils/polyfills/polyfill-imageData.js";
import colors, { getTileVariantIndex } from "../../../utils/dbs/colors.js";
import LAYERS from "../../../utils/dbs/LAYERS.js";
import { getCoatingBrightness, applyBrightness, applySpecialPaint } from "../../../utils/colors/paintColorBlending.js";

import { map } from "../../../utils/number.js";

export default async function() {
    if (!Worker.worldObject) {
        throw new Error("worker error: render: no world loaded");
        return;
    }

    let layersImages = [];
    Object.values(LAYERS).forEach(LAYER => {
        layersImages[LAYER] = new ImageData(Worker.worldObject.header.maxTilesX, Worker.worldObject.header.maxTilesY);
    })

    const bgLayers = {
        ground: Worker.worldObject.header.worldSurface,
        cavern: Worker.worldObject.header.rockLayer,
        underworld: Worker.worldObject.header.maxTilesY - 200
    };

    let position = 0;
    function setPointColor(LAYER, color) {
        if (!color)
            color = { r:0, g:0, b:0, a:0 };

        layersImages[LAYER].data[position]     = color.r;
        layersImages[LAYER].data[position + 1] = color.g;
        layersImages[LAYER].data[position + 2] = color.b;
        layersImages[LAYER].data[position + 3] = color.a;
    }

    const snowTiles = [147, 161, 162, 163, 163, 200];
    function checkSnowGradient(colorCache) {

    }

    postMessage({
        action: "RETURN_RENDERING_PERCENT_INCOMING",
    });

    const drawOnePercent = Worker.worldObject.header.maxTilesY / 100;
    let drawPercentNext = 0;
    let drawPercent = 0;
    for (let y = 0; y < Worker.worldObject.header.maxTilesY; y++) {
        if (y > drawPercentNext) {
            drawPercentNext += drawOnePercent;
            drawPercent++;
            postMessage({
                action: "RETURN_RENDERING_PERCENT",
                percent: drawPercent
            });
        }

        let backgroundColumnCache = [];

        for (let x = 0; x < Worker.worldObject.header.maxTilesX; x++) {
            const tile = Worker.worldObject.tiles[x][y];

            if (tile.blockId !== undefined && colors[LAYERS.TILES][tile.blockId]) {
                // Get base tile color (handling variant tiles)
                const baseColor = colors[LAYERS.TILES][tile.blockId].r !== undefined
                    ? colors[LAYERS.TILES][tile.blockId]
                    : colors[LAYERS.TILES][tile.blockId][getTileVariantIndex(tile.blockId, tile.frameX, tile.frameY, x, y)];

                // Calculate coating brightness
                const brightness = getCoatingBrightness(tile.invisibleBlock, tile.fullBrightBlock);

                // Check if special paint (Shadow=29 or Negative=30)
                if (tile.blockColor === 29 || tile.blockColor === 30) {
                    // Special paints modify the base color, don't use separate paint layer
                    const specialColor = applySpecialPaint(baseColor, tile.blockColor, brightness, false);
                    setPointColor(LAYERS.TILES, specialColor);
                } else {
                    // Always render base color with brightness to TILES layer
                    setPointColor(LAYERS.TILES, applyBrightness(baseColor, brightness));

                    // Render normal paint to separate TILEPAINT layer if present
                    if (tile.blockColor !== undefined && tile.blockColor !== 0 && tile.blockColor !== 31) {
                        const paintColor = colors[LAYERS.TILEPAINT][tile.blockColor];
                        if (paintColor) {
                            setPointColor(LAYERS.TILEPAINT, paintColor);
                        }
                    }
                }
            }

            if (tile.liquidType)
                setPointColor(LAYERS.LIQUIDS, colors[LAYERS.LIQUIDS][tile.liquidType]);

            if (tile.wallId !== undefined && colors[LAYERS.WALLS][tile.wallId]) {
                const baseColor = colors[LAYERS.WALLS][tile.wallId];

                // Calculate coating brightness
                const brightness = getCoatingBrightness(tile.invisibleWall, tile.fullBrightWall);

                // Check if special paint (Shadow=29 or Negative=30)
                if (tile.wallColor === 29 || tile.wallColor === 30) {
                    // Special paints modify the base color, don't use separate paint layer
                    const specialColor = applySpecialPaint(baseColor, tile.wallColor, brightness, true);
                    setPointColor(LAYERS.WALLS, specialColor);
                } else {
                    // Always render base color with brightness to WALLS layer
                    setPointColor(LAYERS.WALLS, applyBrightness(baseColor, brightness));

                    // Render normal paint to separate WALLPAINT layer if present
                    if (tile.wallColor !== undefined && tile.wallColor !== 0 && tile.wallColor !== 31) {
                        const paintColor = colors[LAYERS.WALLPAINT][tile.wallColor];
                        if (paintColor) {
                            setPointColor(LAYERS.WALLPAINT, paintColor);
                        }
                    }
                }
            }

            if (tile.wireRed)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["red"]);
            if (tile.wireGreen)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["green"]);
            if (tile.wireBlue)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["blue"]);
            if (tile.wireYellow)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["yellow"]);

            if (x == 0) {
                if (y < bgLayers.ground) {
                    const gradientPercent = map(y, 0, bgLayers.ground, 0, 1);
                    backgroundColumnCache[y] = {
                        r: colors[LAYERS.BACKGROUND].skyGradient[0].r + gradientPercent * (colors[LAYERS.BACKGROUND].skyGradient[1].r - colors[LAYERS.BACKGROUND].skyGradient[0].r),
                        g: colors[LAYERS.BACKGROUND].skyGradient[0].g + gradientPercent * (colors[LAYERS.BACKGROUND].skyGradient[1].g - colors[LAYERS.BACKGROUND].skyGradient[0].g),
                        b: colors[LAYERS.BACKGROUND].skyGradient[0].b + gradientPercent * (colors[LAYERS.BACKGROUND].skyGradient[1].b - colors[LAYERS.BACKGROUND].skyGradient[0].b),
                        a: 255
                    };
                }
                else if (y >= bgLayers.ground && y < bgLayers.cavern)
                    backgroundColumnCache[y] = colors[LAYERS.BACKGROUND].ground;
                else if (y >= bgLayers.cavern && y < bgLayers.underworld)
                    backgroundColumnCache[y] = colors[LAYERS.BACKGROUND].cavern;
                else if (y >= bgLayers.underworld)
                    backgroundColumnCache[y] = colors[LAYERS.BACKGROUND].underworld;
            }

            setPointColor(LAYERS.BACKGROUND, backgroundColumnCache[y]);
            /*
            if (y < bgLayers.ground || y >= bgLayers.underworld)

            else
                setPointColor(LAYERS.BACKGROUND, checkSnowGradient(backgroundColumnCache[y]));
            */

            position += 4;
        }
    }

    postMessage({
        action: "RETURN_LAYERS_IMAGES_INCOMING",
    });

    postMessage({
        action: "RETURN_LAYERS_IMAGES",
        layersImages
    });
}