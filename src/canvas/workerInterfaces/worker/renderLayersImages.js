import workerState from "../../workerState.js";

import "../../../utils/polyfills/polyfill-imageData.js";
import colors from "../../../utils/dbs/colors.js";
import LAYERS from "../../../utils/dbs/LAYERS.js";
import { getTileColor, getPaintColor } from "../../../utils/rendering/tileRenderer.js";
import { TileFlag } from "terraria-world-file";

import { map } from "../../../utils/number.js";

export default async function(data, messageId) {
    if (!workerState.worldObject) {
        throw new Error("worker error: render: no world loaded");
        return;
    }

    let layersImages = [];
    Object.values(LAYERS).forEach(LAYER => {
        layersImages[LAYER] = new ImageData(workerState.worldObject.header.maxTilesX, workerState.worldObject.header.maxTilesY);
    })

    const bgLayers = {
        ground: workerState.worldObject.header.worldSurface,
        cavern: workerState.worldObject.header.rockLayer,
        underworld: workerState.worldObject.header.maxTilesY - 200
    };

    const tiles = workerState.worldObject.tiles;
    const maxTilesX = workerState.worldObject.header.maxTilesX;
    const maxTilesY = workerState.worldObject.header.maxTilesY;
    const height = tiles.height;

    // Direct references to typed arrays for hot loop performance
    const tBlockId = tiles.blockId;
    const tWallId = tiles.wallId;
    const tFlags = tiles.flags;
    const tBlockColor = tiles.blockColor;
    const tWallColor = tiles.wallColor;
    const tLiquidType = tiles.liquidType;
    const tFrameX = tiles.frameX;
    const tFrameY = tiles.frameY;

    let position = 0;
    function setPointColor(LAYER, color) {
        if (!color)
            color = { r:0, g:0, b:0, a:0 };

        layersImages[LAYER].data[position]     = color.r;
        layersImages[LAYER].data[position + 1] = color.g;
        layersImages[LAYER].data[position + 2] = color.b;
        layersImages[LAYER].data[position + 3] = color.a;
    }

    postMessage({
        action: "RETURN_RENDERING_PERCENT_INCOMING",
        messageId
    });

    const drawOnePercent = maxTilesY / 100;
    let drawPercentNext = 0;
    let drawPercent = 0;
    for (let y = 0; y < maxTilesY; y++) {
        if (y > drawPercentNext) {
            drawPercentNext += drawOnePercent;
            drawPercent++;
            postMessage({
                action: "RETURN_RENDERING_PERCENT",
                messageId,
                percent: drawPercent
            });
        }

        let backgroundColumnCache = [];

        for (let x = 0; x < maxTilesX; x++) {
            const i = x * height + y;
            const f = tFlags[i];
            const blockId = tBlockId[i];
            const wallId = tWallId[i];
            const blockColor = tBlockColor[i];
            const wallColor = tWallColor[i];
            const liquidType = tLiquidType[i];

            if ((f & TileFlag.IS_BLOCK_ACTIVE) && colors[LAYERS.TILES][blockId]) {
                // Build a minimal tile object for the renderer
                const tile = {
                    blockId,
                    frameX: tFrameX[i],
                    frameY: tFrameY[i],
                    invisibleBlock: !!(f & TileFlag.INVISIBLE_BLOCK),
                    fullBrightBlock: !!(f & TileFlag.FULL_BRIGHT_BLOCK),
                };

                const tileColor = getTileColor(tile, LAYERS.TILES, undefined, x, y, null);
                if (tileColor && tileColor.a > 0) {
                    setPointColor(LAYERS.TILES, tileColor);
                }

                // Render normal paint to separate TILEPAINT layer if present
                if (blockColor !== 0 && blockColor !== 31 &&
                    blockColor !== 29 && blockColor !== 30) {
                    const paintColor = getPaintColor(tile, LAYERS.TILEPAINT, blockColor, x, y, null);
                    if (paintColor) {
                        setPointColor(LAYERS.TILEPAINT, paintColor);
                    }
                }
            }

            if (liquidType)
                setPointColor(LAYERS.LIQUIDS, colors[LAYERS.LIQUIDS][liquidType]);

            if (wallId !== 0 && colors[LAYERS.WALLS][wallId]) {
                const tile = {
                    wallId,
                    invisibleWall: !!(f & TileFlag.INVISIBLE_WALL),
                    fullBrightWall: !!(f & TileFlag.FULL_BRIGHT_WALL),
                };

                const wallColor_ = getTileColor(tile, LAYERS.WALLS, undefined, x, y, null);
                if (wallColor_ && wallColor_.a > 0) {
                    setPointColor(LAYERS.WALLS, wallColor_);
                }

                // Render normal paint to separate WALLPAINT layer if present
                if (wallColor !== 0 && wallColor !== 31 &&
                    wallColor !== 29 && wallColor !== 30) {
                    const paintColor = getPaintColor(tile, LAYERS.WALLPAINT, wallColor, x, y, null);
                    if (paintColor) {
                        setPointColor(LAYERS.WALLPAINT, paintColor);
                    }
                }
            }

            if (f & TileFlag.WIRE_RED)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["red"]);
            if (f & TileFlag.WIRE_GREEN)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["green"]);
            if (f & TileFlag.WIRE_BLUE)
                setPointColor(LAYERS.WIRES, colors[LAYERS.WIRES]["blue"]);
            if (f & TileFlag.WIRE_YELLOW)
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

            position += 4;
        }
    }

    postMessage({
        action: "RETURN_LAYERS_IMAGES_INCOMING",
        messageId
    });

    postMessage({
        action: "RETURN_LAYERS_IMAGES",
        messageId,
        layersImages
    });
}
