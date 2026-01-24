import React from "react";

import LAYERS from "../../utils/dbs/LAYERS.js";
import PAINTS from "../../utils/dbs/PAINTS.js";
import editableTiles from "../../utils/dbs/editable-tiles.js";
import editableWalls from "../../utils/dbs/editable-walls.js";
import InputCheckbox from "../inputs/input-checkbox.jsx";
import InputSelect from "../inputs/input-select.jsx";
import InputSlider from "../inputs/input-slider.jsx";

const SLOPE_OPTIONS = [
    ["None (Full)", undefined],
    ["Half Block", "half"],
    ["Top Right", "TR"],
    ["Top Left", "TL"],
    ["Bottom Right", "BR"],
    ["Bottom Left", "BL"]
];

const PAINT_OPTIONS = PAINTS.map(paint => [paint.name, paint.id]);

// Prepare tile and wall options
const tiles = Object.entries(editableTiles).map(([id, name]) => [name, parseInt(id)]);
const walls = Object.entries(editableWalls).map(([id, name]) => [name, parseInt(id)]);
const tilesOrdered = [...tiles].sort((a, b) => a[0].localeCompare(b[0]));
const wallsOrdered = [...walls].sort((a, b) => a[0].localeCompare(b[0]));

function OptionbarOptionTileEditOptions({ state, setState, tool }) {
    // Default tileEditOptions if not present (backward compatibility with old saved state)
    const defaultOptions = {
        editBlockId: true,
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
        actuated: false
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

    const isTileLayer = currentLayer === LAYERS.TILES;
    const isWallLayer = currentLayer === LAYERS.WALLS;
    const isPaintedTilesLayer = currentLayer === LAYERS.TILEPAINT;
    const isPaintedWallsLayer = currentLayer === LAYERS.WALLPAINT;

    // Don't show panel for layers that don't support property editing
    if (!isTileLayer && !isWallLayer && !isPaintedTilesLayer && !isPaintedWallsLayer) {
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
                                <InputSelect
                                    options={state.ordered ? tilesOrdered : tiles}
                                    value={state.id + ""}
                                    onChange={(value) => setState({ ...state, id: parseInt(value) })}
                                    disabled={!options.editBlockId}
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
                                <InputSelect
                                    options={PAINT_OPTIONS}
                                    value={options.blockColor}
                                    onChange={(value) => updateOption('blockColor', parseInt(value))}
                                    disabled={!options.editBlockColor}
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
                                    onChange={(value) => updateOption('slope', value === 'undefined' ? undefined : value)}
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
                                <InputSelect
                                    options={state.ordered ? wallsOrdered : walls}
                                    value={state.id}
                                    onChange={(value) => setState({ ...state, id: parseInt(value) })}
                                    disabled={!options.editWallId}
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
                                <InputSelect
                                    options={PAINT_OPTIONS}
                                    value={options.wallColor}
                                    onChange={(value) => updateOption('wallColor', parseInt(value))}
                                    disabled={!options.editWallColor}
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
                <div className="tile-edit-card">
                    <div className="tile-edit-card-header">Coatings</div>
                    <div className="tile-edit-card-body">
                        {(isTileLayer || isPaintedTilesLayer) && (
                            <>
                                <InputCheckbox
                                    label="Echo"
                                    value={options.editInvisibleBlock}
                                    onChange={(checked) => {
                                        updateOption('editInvisibleBlock', checked);
                                        if (checked) updateOption('invisibleBlock', true);
                                    }}
                                />
                                <InputCheckbox
                                    label="Illuminate"
                                    value={options.editFullBrightBlock}
                                    onChange={(checked) => {
                                        updateOption('editFullBrightBlock', checked);
                                        if (checked) updateOption('fullBrightBlock', true);
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
                                        updateOption('editInvisibleWall', checked);
                                        if (checked) updateOption('invisibleWall', true);
                                    }}
                                />
                                <InputCheckbox
                                    label="Illuminate"
                                    value={options.editFullBrightWall}
                                    onChange={(checked) => {
                                        updateOption('editFullBrightWall', checked);
                                        if (checked) updateOption('fullBrightWall', true);
                                    }}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    WIRING CARD
                    Actuator settings: Actuator (installed) and IsActive (triggered)
                    Only valid for tiles with blockId > 0
                    ═══════════════════════════════════════════════════════════════ */}
                {(isTileLayer || isPaintedTilesLayer) && (
                    <div className="tile-edit-card">
                        <div className="tile-edit-card-header">Wiring</div>
                        <div className="tile-edit-card-body">
                            <InputCheckbox
                                label="Actuator"
                                value={options.editActuator}
                                onChange={(checked) => {
                                    updateOption('editActuator', checked);
                                    if (checked) updateOption('actuator', true);
                                }}
                            />
                            <InputCheckbox
                                label="IsActive"
                                value={options.editActuated}
                                onChange={(checked) => {
                                    updateOption('editActuated', checked);
                                    if (checked) updateOption('actuated', true);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default OptionbarOptionTileEditOptions;
