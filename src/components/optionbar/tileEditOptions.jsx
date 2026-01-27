import React, { useEffect } from "react";

import LAYERS from "../../utils/dbs/LAYERS.js";
import PAINTS from "../../utils/dbs/paints.js";
import colors from "../../utils/dbs/colors.js";
import editableTiles from "../../utils/dbs/editable-tiles.js";
import editableWalls from "../../utils/dbs/editable-walls.js";
import InputCheckbox from "../inputs/input-checkbox.jsx";
import InputSelect from "../inputs/input-select.jsx";
import InputSelectWithColor from "../inputs/input-select-with-color.jsx";
import InputSlider from "../inputs/input-slider.jsx";

const SLOPE_OPTIONS = [
    ["None (Full)", undefined],
    ["Half Block", 1],
    ["Top Right", 2],
    ["Top Left", 3],
    ["Bottom Right", 4],
    ["Bottom Left", 5]
];

// Paints with colors
const PAINT_OPTIONS = PAINTS.map(paint => [paint.name, paint.id, paint.color]);

// Prepare tile and wall options with colors
const tiles = Object.entries(editableTiles).map(([id, name]) => [
    name,
    parseInt(id),
    colors[LAYERS.TILES][parseInt(id)]
]);
const walls = Object.entries(editableWalls).map(([id, name]) => [
    name,
    parseInt(id),
    colors[LAYERS.WALLS][parseInt(id)]
]);
const tilesOrdered = [...tiles].sort((a, b) => a[0].localeCompare(b[0]));
const wallsOrdered = [...walls].sort((a, b) => a[0].localeCompare(b[0]));

// Liquid type options with colors
const LIQUID_OPTIONS = [
    ["Water", 1, colors[LAYERS.LIQUIDS][1]],
    ["Lava", 2, colors[LAYERS.LIQUIDS][2]],
    ["Honey", 3, colors[LAYERS.LIQUIDS][3]],
    ["Shimmer", 4, colors[LAYERS.LIQUIDS][4]]
];

// Wire colors for visual indicators
const WIRE_COLORS = {
    red: colors[LAYERS.WIRES].red,
    green: colors[LAYERS.WIRES].green,
    blue: colors[LAYERS.WIRES].blue,
    yellow: colors[LAYERS.WIRES].yellow
};

function OptionbarOptionTileEditOptions({ state, setState, tool }) {
    // Default tileEditOptions if not present (backward compatibility with old saved state)
    const defaultOptions = {
        editBlockId: false,
        editBlockColor: false,
        blockColor: 0,
        editSlope: false,
        slope: undefined,
        editInvisibleBlock: false,
        invisibleBlock: false,
        editFullBrightBlock: false,
        fullBrightBlock: false,
        editWallId: false,
        editWallColor: false,
        wallColor: 0,
        editInvisibleWall: false,
        invisibleWall: false,
        editFullBrightWall: false,
        fullBrightWall: false,
        editActuator: false,
        actuator: false,
        editActuated: false,
        actuated: false,
        // Liquid properties
        editLiquidType: false,
        liquidType: 1,
        editLiquidAmount: false,
        liquidAmount: 255,
        // Block/liquid interaction
        overwriteLiquids: true
    };

    const options = state.tileEditOptions || defaultOptions;
    const currentLayer = state.layer;

    const updateOption = (key, value) => {
        setState({
            ...state,
            tileEditOptions: {
                ...options,
                [key]: value
            }
        });
    };

    // Batch update multiple tileEditOptions properties in a single state update
    const updateOptions = (updates) => {
        setState({
            ...state,
            tileEditOptions: {
                ...options,
                ...updates
            }
        });
    };

    const isTileLayer = currentLayer === LAYERS.TILES;
    const isWallLayer = currentLayer === LAYERS.WALLS;
    const isPaintedTilesLayer = currentLayer === LAYERS.TILEPAINT;
    const isPaintedWallsLayer = currentLayer === LAYERS.WALLPAINT;
    const isWireLayer = currentLayer === LAYERS.WIRES;
    const isLiquidLayer = currentLayer === LAYERS.LIQUIDS;

    // Sync blockId/wallId from legacy state.id when not yet set in tileEditOptions.
    // The id.jsx dropdown sets state.id but not tileEditOptions.blockId, causing the
    // display (which falls back to state.id) to show a tile that isn't actually selected.
    useEffect(() => {
        if ((isTileLayer || isPaintedTilesLayer) && (options.blockId === null || options.blockId === undefined) && state.id !== null && state.id !== undefined) {
            updateOption('blockId', parseInt(state.id));
        }
        if ((isWallLayer || isPaintedWallsLayer) && (options.wallId === null || options.wallId === undefined) && state.id !== null && state.id !== undefined) {
            updateOption('wallId', parseInt(state.id));
        }
    }, [state.id, currentLayer]);

    // Don't show panel for layers that don't support property editing
    if (!isTileLayer && !isWallLayer && !isPaintedTilesLayer && !isPaintedWallsLayer && !isWireLayer && !isLiquidLayer) {
        return null;
    }

    // Helper functions for tool-specific options
    const onChangeLocked = () => {
        if (state.locked)
            setState({ ...state, locked: false });
        else
            setState({ ...state, locked: true, size: [state.size[0], state.size[0]] });
    };

    const onChangeWidth = (x) => {
        if (state.locked)
            setState({ ...state, size: [parseInt(x), parseInt(x)] });
        else
            setState({ ...state, size: [parseInt(x), state.size[1]] });
    };

    const onChangeHeight = (y) => {
        setState({ ...state, size: [state.size[0], parseInt(y)] });
    };

    const onChangeRadius = (newRadius) => {
        setState({ ...state, radius: parseInt(newRadius) });
    };

    return (
        <div className="optionbar-section tile-edit-options">
            <div className="tile-edit-cards">
                {/* ═══════════════════════════════════════════════════════════════
                    PENCIL/BRUSH TOOL OPTIONS CARD
                    Layer, lock sides, and size settings
                    ═══════════════════════════════════════════════════════════════ */}
                {tool === "pencil" && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Pencil</div>
                        <div className="tile-edit-card-body">
                            <InputCheckbox
                                label="Lock sides"
                                value={state.locked}
                                onChange={onChangeLocked}
                            />
                            {state.locked ? (
                                <InputSlider
                                    label="Size"
                                    value={state.size[0]}
                                    min={1}
                                    max={72}
                                    onChange={onChangeWidth}
                                    sliderWidth="6rem"
                                    input
                                    inputMin={1}
                                    inputMax={999}
                                    inputWidth="5ch"
                                />
                            ) : (
                                <>
                                    <InputSlider
                                        label="Width"
                                        value={state.size[0]}
                                        min={1}
                                        max={72}
                                        onChange={onChangeWidth}
                                        sliderWidth="6rem"
                                        input
                                        inputMin={1}
                                        inputMax={999}
                                        inputWidth="5ch"
                                    />
                                    <InputSlider
                                        label="Height"
                                        value={state.size[1]}
                                        min={1}
                                        max={72}
                                        onChange={onChangeHeight}
                                        sliderWidth="6rem"
                                        input
                                        inputMin={1}
                                        inputMax={999}
                                        inputWidth="5ch"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    BUCKET FILL OPTIONS CARD
                    Fill radius setting
                    ═══════════════════════════════════════════════════════════════ */}
                {tool === "bucket" && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Bucket</div>
                        <div className="tile-edit-card-body">
                            <InputSlider
                                label="Fill radius"
                                value={state.radius}
                                min={50}
                                max={2000}
                                onChange={onChangeRadius}
                                sliderWidth="6rem"
                                input
                                inputMin={10}
                                inputMax={99999}
                                inputWidth="6ch"
                            />
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    TILE ID CARD
                    Tile/Block selection dropdown with ordering options
                    ═══════════════════════════════════════════════════════════════ */}
                {(isTileLayer || isPaintedTilesLayer) && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Tile</div>
                        <div className="tile-edit-card-body">
                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Modify"
                                    value={options.editBlockId}
                                    onChange={(checked) => updateOption('editBlockId', checked)}
                                />
                                <InputSelectWithColor
                                    options={state.ordered ? tilesOrdered : tiles}
                                    value={(options.blockId ?? state.id ?? "") + ""}
                                    onChange={(value) => {
                                        const blockId = parseInt(value);
                                        setState({
                                            ...state,
                                            id: blockId,  // Backward compatibility
                                            tileEditOptions: {
                                                ...options,
                                                blockId: blockId
                                            }
                                        });
                                    }}
                                    disabled={!options.editBlockId}
                                    width="150px"
                                />
                            </div>
                            <div className="tile-edit-inline-row">
                                <span className="input-label" style={{ fontSize: '0.75rem', marginRight: '0.3rem' }}>Order by</span>
                                <InputCheckbox
                                    label="ID"
                                    value={!state.ordered}
                                    onChange={() => setState({ ...state, ordered: false })}
                                />
                                <InputCheckbox
                                    label="Name"
                                    value={state.ordered}
                                    onChange={() => setState({ ...state, ordered: true })}
                                />
                            </div>
                            {isTileLayer && (
                                <InputCheckbox
                                    label="Overwrite Liquids"
                                    value={options.overwriteLiquids !== false}
                                    onChange={(checked) => updateOption('overwriteLiquids', checked)}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    TILE STYLE CARD
                    Tile/Block appearance settings: paint color and slope style
                    ═══════════════════════════════════════════════════════════════ */}
                {(isTileLayer || isPaintedTilesLayer) && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Style</div>
                        <div className="tile-edit-card-body">
                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Paint"
                                    value={options.editBlockColor}
                                    onChange={(checked) => updateOption('editBlockColor', checked)}
                                />
                                <InputSelectWithColor
                                    options={PAINT_OPTIONS}
                                    value={options.blockColor}
                                    onChange={(value) => updateOption('blockColor', parseInt(value))}
                                    disabled={!options.editBlockColor}
                                    width="100px"
                                />
                            </div>

                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Slope"
                                    value={options.editSlope}
                                    onChange={(checked) => updateOption('editSlope', checked)}
                                />
                                <InputSelect
                                    options={SLOPE_OPTIONS}
                                    value={options.slope}
                                    onChange={(value) => updateOption('slope', value === 'undefined' ? undefined : parseInt(value))}
                                    disabled={!options.editSlope}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    WALL ID CARD
                    Wall selection dropdown with ordering options
                    ═══════════════════════════════════════════════════════════════ */}
                {(isWallLayer || isPaintedWallsLayer) && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Wall</div>
                        <div className="tile-edit-card-body">
                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Modify"
                                    value={options.editWallId}
                                    onChange={(checked) => updateOption('editWallId', checked)}
                                />
                                <InputSelectWithColor
                                    options={state.ordered ? wallsOrdered : walls}
                                    value={(options.wallId ?? state.id ?? "") + ""}
                                    onChange={(value) => {
                                        const wallId = parseInt(value);
                                        setState({
                                            ...state,
                                            id: wallId,  // Backward compatibility
                                            tileEditOptions: {
                                                ...options,
                                                wallId: wallId
                                            }
                                        });
                                    }}
                                    disabled={!options.editWallId}
                                    width="150px"
                                />
                            </div>
                            <div className="tile-edit-inline-row">
                                <span className="input-label" style={{ fontSize: '0.75rem', marginRight: '0.3rem' }}>Order by</span>
                                <InputCheckbox
                                    label="ID"
                                    value={!state.ordered}
                                    onChange={() => setState({ ...state, ordered: false })}
                                />
                                <InputCheckbox
                                    label="Name"
                                    value={state.ordered}
                                    onChange={() => setState({ ...state, ordered: true })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    WALL STYLE CARD
                    Wall appearance settings: paint color only
                    ═══════════════════════════════════════════════════════════════ */}
                {(isWallLayer || isPaintedWallsLayer) && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Style</div>
                        <div className="tile-edit-card-body">
                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Paint"
                                    value={options.editWallColor}
                                    onChange={(checked) => updateOption('editWallColor', checked)}
                                />
                                <InputSelectWithColor
                                    options={PAINT_OPTIONS}
                                    value={options.wallColor}
                                    onChange={(value) => updateOption('wallColor', parseInt(value))}
                                    disabled={!options.editWallColor}
                                    width="100px"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    COATINGS CARD
                    Visual effects: Echo (invisible) and Illuminate (fullbright)
                    Available for both tiles and walls (v269+/1.4.4+)
                    ═══════════════════════════════════════════════════════════════ */}
                {(isTileLayer || isWallLayer || isPaintedTilesLayer || isPaintedWallsLayer) && (
                <div className="tile-edit-card">
                    <div className="tile-edit-card-header">Coatings</div>
                    <div className="tile-edit-card-body">
                        {(isTileLayer || isPaintedTilesLayer) && (
                            <>
                                <InputCheckbox
                                    label="Echo"
                                    value={options.editInvisibleBlock}
                                    onChange={(checked) => {
                                        updateOptions({
                                            editInvisibleBlock: checked,
                                            ...(checked && { invisibleBlock: true })
                                        });
                                    }}
                                />
                                <InputCheckbox
                                    label="Illuminate"
                                    value={options.editFullBrightBlock}
                                    onChange={(checked) => {
                                        updateOptions({
                                            editFullBrightBlock: checked,
                                            ...(checked && { fullBrightBlock: true })
                                        });
                                    }}
                                />
                            </>
                        )}

                        {(isWallLayer || isPaintedWallsLayer) && (
                            <>
                                <InputCheckbox
                                    label="Echo"
                                    value={options.editInvisibleWall}
                                    onChange={(checked) => {
                                        updateOptions({
                                            editInvisibleWall: checked,
                                            ...(checked && { invisibleWall: true })
                                        });
                                    }}
                                />
                                <InputCheckbox
                                    label="Illuminate"
                                    value={options.editFullBrightWall}
                                    onChange={(checked) => {
                                        updateOptions({
                                            editFullBrightWall: checked,
                                            ...(checked && { fullBrightWall: true })
                                        });
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    WIRING CARD
                    Actuator settings: Actuator (installed) and IsActive (triggered)
                    Only valid for tiles with blockId >= 0
                    ═══════════════════════════════════════════════════════════════ */}
                {(isTileLayer || isPaintedTilesLayer) && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Wiring</div>
                        <div className="tile-edit-card-body">
                            <InputCheckbox
                                label="Actuator"
                                value={options.editActuator}
                                onChange={(checked) => {
                                    updateOptions({
                                        editActuator: checked,
                                        ...(checked && { actuator: true })
                                    });
                                }}
                            />
                            <InputCheckbox
                                label="IsActive"
                                value={options.editActuated}
                                onChange={(checked) => {
                                    updateOptions({
                                        editActuated: checked,
                                        ...(checked && { actuated: true })
                                    });
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    WIRES CARD
                    Wire color toggles: Red, Green, Blue, Yellow (2x2 grid)
                    Available only on WIRES layer
                    ═══════════════════════════════════════════════════════════════ */}
                {isWireLayer && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Wires</div>
                        <div className="tile-edit-card-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '55px' }}>
                                        <InputCheckbox
                                            label="Red"
                                            value={options.editWireRed}
                                            onChange={(checked) => {
                                                updateOptions({
                                                    editWireRed: checked,
                                                    ...(checked && { wireRed: true })
                                                });
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: `rgba(${WIRE_COLORS.red.r},${WIRE_COLORS.red.g},${WIRE_COLORS.red.b},1)`,
                                            borderRadius: '2px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '55px' }}>
                                        <InputCheckbox
                                            label="Green"
                                            value={options.editWireGreen}
                                            onChange={(checked) => {
                                                updateOptions({
                                                    editWireGreen: checked,
                                                    ...(checked && { wireGreen: true })
                                                });
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: `rgba(${WIRE_COLORS.green.r},${WIRE_COLORS.green.g},${WIRE_COLORS.green.b},1)`,
                                            borderRadius: '2px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '55px' }}>
                                        <InputCheckbox
                                            label="Blue"
                                            value={options.editWireBlue}
                                            onChange={(checked) => {
                                                updateOptions({
                                                    editWireBlue: checked,
                                                    ...(checked && { wireBlue: true })
                                                });
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: `rgba(${WIRE_COLORS.blue.r},${WIRE_COLORS.blue.g},${WIRE_COLORS.blue.b},1)`,
                                            borderRadius: '2px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '55px' }}>
                                        <InputCheckbox
                                            label="Yellow"
                                            value={options.editWireYellow}
                                            onChange={(checked) => {
                                                updateOptions({
                                                    editWireYellow: checked,
                                                    ...(checked && { wireYellow: true })
                                                });
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: `rgba(${WIRE_COLORS.yellow.r},${WIRE_COLORS.yellow.g},${WIRE_COLORS.yellow.b},1)`,
                                            borderRadius: '2px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    LIQUIDS CARD
                    Liquid type selection and amount slider
                    Available only on LIQUIDS layer
                    ═══════════════════════════════════════════════════════════════ */}
                {isLiquidLayer && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Liquids</div>
                        <div className="tile-edit-card-body">
                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Type"
                                    value={options.editLiquidType}
                                    onChange={(checked) => updateOption('editLiquidType', checked)}
                                />
                                <InputSelectWithColor
                                    options={LIQUID_OPTIONS}
                                    value={options.liquidType ?? 1}
                                    onChange={(value) => updateOption('liquidType', value)}
                                    disabled={!options.editLiquidType}
                                    width="100px"
                                />
                            </div>
                            <div className="tile-edit-inline-row">
                                <InputCheckbox
                                    label="Amount"
                                    value={options.editLiquidAmount}
                                    onChange={(checked) => updateOption('editLiquidAmount', checked)}
                                />
                                <InputSlider
                                    value={options.liquidAmount ?? 255}
                                    min={0}
                                    max={255}
                                    onChange={(value) => updateOption('liquidAmount', parseInt(value))}
                                    disabled={!options.editLiquidAmount}
                                    sliderWidth="5rem"
                                    input
                                    inputWidth="4ch"
                                    inputMin={0}
                                    inputMax={255}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OptionbarOptionTileEditOptions;
