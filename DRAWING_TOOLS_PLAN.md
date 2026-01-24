# Drawing Tools Implementation Plan

## Overview

This document outlines the implementation plan for enhancing the Terraria Map Editor web application with improved drawing tools, including:

1. **Fixed Pencil Tool** - Line interpolation for continuous strokes
2. **Brush Tool** - Square and ellipse shapes with configurable size
3. **Enhanced Eraser** - Brush shapes with line interpolation
4. **Bucket Fill Tool** - Flood fill algorithm
5. **Rectangle Selection Tool** - Limit operations to selected region

## Current Issues Analysis

### Pencil Tool Bug
**File**: `src/canvas/tools/pencil.js:76-82`

The current implementation only draws at discrete mouse positions, creating gaps during fast movement:

```javascript
// Current buggy code
if (Main.mousePosImageX == Main.listeners.prevMousePosImageX &&
    Main.mousePosImageY == Main.listeners.prevMousePosImageY)
    return;

Main.listeners.prevMousePosImageX = Main.mousePosImageX;
Main.listeners.prevMousePosImageY = Main.mousePosImageY;
```

**Problem**: No interpolation between previous and current positions.

### Flood Fill Bugs
**File**: `src/canvas/workerInterfaces/worker/editTiles.js:134, 158`

Critical bug in commented flood fill code:
```javascript
// WRONG: x=1,y=2 and x=2,y=1 both give 3 (collision!)
if (alreadyChecked.includes(x + y))
    continue;
alreadyChecked.push(x + y);

// CORRECT: Unique string key
if (alreadyChecked.has(`${x},${y}`))
    continue;
alreadyChecked.add(`${x},${y}`);
```

## Implementation Algorithms

### 1. Bresenham Line Algorithm

**Purpose**: Draw continuous line between two points (fix pencil gaps)

**Source**: `D:\dev\ai\tedit\Terraria-Map-Editor\src\TEdit.Common\Geometry\Shape.cs:7-72`

**JavaScript Implementation**:

```javascript
/**
 * Bresenham's line drawing algorithm
 * Returns all pixel coordinates along the line from start to end
 *
 * @param {Object} start - Starting point {x, y}
 * @param {Object} end - Ending point {x, y}
 * @returns {Array<{x, y}>} Array of points along the line
 */
export function drawLine(start, end) {
    const points = [];

    let x0 = start.x;
    let y0 = start.y;
    let x1 = end.x;
    let y1 = end.y;

    let dy = y1 - y0;
    let dx = x1 - x0;
    let stepx, stepy;

    // Determine step direction
    if (dy < 0) {
        dy = -dy;
        stepy = -1;
    } else {
        stepy = 1;
    }

    if (dx < 0) {
        dx = -dx;
        stepx = -1;
    } else {
        stepx = 1;
    }

    // Bit shift for multiplication by 2 (faster than * 2)
    dy = dy << 1;
    dx = dx << 1;

    // Always include start point
    points.push({x: x0, y: y0});

    if (dx > dy) {
        // Line is more horizontal than vertical
        let fraction = dy - (dx >> 1);  // Bit shift for division by 2
        while (x0 !== x1) {
            if (fraction >= 0) {
                y0 += stepy;
                fraction -= dx;
            }
            x0 += stepx;
            fraction += dy;
            points.push({x: x0, y: y0});
        }
    } else {
        // Line is more vertical than horizontal
        let fraction = dx - (dy >> 1);
        while (y0 !== y1) {
            if (fraction >= 0) {
                x0 += stepx;
                fraction -= dy;
            }
            y0 += stepy;
            fraction += dx;
            points.push({x: x0, y: y0});
        }
    }

    return points;
}
```

**Complexity**: O(max(dx, dy)) - Linear in the longer dimension

**Usage Example**:
```javascript
const linePoints = drawLine({x: 10, y: 10}, {x: 20, y: 15});
// Returns: [{x:10,y:10}, {x:11,y:11}, {x:12,y:11}, ...]
```

### 2. Filled Rectangle Algorithm

**Purpose**: Generate all tiles for rectangular brush

**JavaScript Implementation**:

```javascript
/**
 * Fill a rectangle centered at a point
 *
 * @param {Object} center - Center point {x, y}
 * @param {Object} size - Size {x: width, y: height}
 * @returns {Array<{x, y}>} Array of points filling the rectangle
 */
export function fillRectangleCentered(center, size) {
    const points = [];

    const halfX = Math.floor(size.x / 2);
    const halfY = Math.floor(size.y / 2);

    const x1 = center.x - halfX;
    const y1 = center.y - halfY;
    const x2 = center.x + Math.ceil(size.x / 2);
    const y2 = center.y + Math.ceil(size.y / 2);

    for (let x = x1; x < x2; x++) {
        for (let y = y1; y < y2; y++) {
            points.push({x, y});
        }
    }

    return points;
}
```

**Complexity**: O(width × height)

### 3. Filled Ellipse Algorithm (Midpoint)

**Purpose**: Generate all tiles for elliptical/circular brush

**Source**: `D:\dev\ai\tedit\Terraria-Map-Editor\src\TEdit.Common\Geometry\Fill.cs:73-191`

**JavaScript Implementation**:

```javascript
/**
 * Midpoint ellipse algorithm - fills ellipse centered at point
 * Uses integer-only arithmetic for performance
 *
 * @param {Object} center - Center point {x, y}
 * @param {Object} radius - Radius {x: radiusX, y: radiusY}
 * @returns {Array<{x, y}>} Array of points filling the ellipse
 */
export function fillEllipseCentered(center, radius) {
    const points = [];

    const xr = radius.x;
    const yr = radius.y;
    const xc = center.x;
    const yc = center.y;

    if (xr < 1 || yr < 1) {
        return [{x: xc, y: yc}];
    }

    // Phase 1: Where tangent slope > -1
    let x = xr;
    let y = 0;
    const xrSqTwo = (xr * xr) << 1;
    const yrSqTwo = (yr * yr) << 1;
    let xChg = yr * yr * (1 - (xr << 1));
    let yChg = xr * xr;
    let err = 0;
    let xStopping = yrSqTwo * xr;
    let yStopping = 0;

    while (xStopping >= yStopping) {
        // Draw horizontal line from (xc-x, yc+y) to (xc+x, yc+y)
        for (let i = xc - x; i <= xc + x; i++) {
            points.push({x: i, y: yc + y});  // Upper half
            points.push({x: i, y: yc - y});  // Lower half
        }

        y++;
        yStopping += xrSqTwo;
        err += yChg;
        yChg += xrSqTwo;

        if ((xChg + (err << 1)) > 0) {
            x--;
            xStopping -= yrSqTwo;
            err += xChg;
            xChg += yrSqTwo;
        }
    }

    // Phase 2: Where tangent slope < -1
    x = 0;
    y = yr;
    xChg = yr * yr;
    yChg = xr * xr * (1 - (yr << 1));
    err = 0;
    xStopping = 0;
    yStopping = xrSqTwo * yr;

    while (xStopping <= yStopping) {
        // Draw horizontal line from (xc-x, yc+y) to (xc+x, yc+y)
        for (let i = xc - x; i <= xc + x; i++) {
            points.push({x: i, y: yc + y});  // Upper half
            points.push({x: i, y: yc - y});  // Lower half
        }

        x++;
        xStopping += yrSqTwo;
        err += xChg;
        xChg += yrSqTwo;

        if ((yChg + (err << 1)) > 0) {
            y--;
            yStopping -= xrSqTwo;
            err += yChg;
            yChg += xrSqTwo;
        }
    }

    return points;
}
```

**Complexity**: O(π × radiusX × radiusY) ≈ O(area)

**Note**: Returns duplicate points for center scanlines - must deduplicate before use.

### 4. Scanline Flood Fill Algorithm

**Purpose**: Bucket fill tool - fill contiguous region of same tile type

**Source**: Based on `D:\dev\ai\tedit\Terraria-Map-Editor\src\TEdit.Common\Geometry\Fill.cs:294-366`

**JavaScript Implementation**:

```javascript
/**
 * Scanline-based flood fill algorithm (non-recursive)
 * Fills all connected tiles matching the boundary value
 *
 * @param {Object} start - Starting point {x, y}
 * @param {Object} maxBounds - Maximum bounds {x: maxX, y: maxY}
 * @param {Function} validationFn - (x, y) => boolean, returns true if tile matches
 * @returns {Array<{x, y}>} Array of all filled points
 */
export function floodFill(start, maxBounds, validationFn) {
    const filled = [];
    const visited = new Set();
    const queue = [];

    queue.push(start);

    while (queue.length > 0) {
        const point = queue.shift();
        const key = `${point.x},${point.y}`;

        // Skip if already visited
        if (visited.has(key)) continue;

        // Skip if out of bounds
        if (point.x < 0 || point.y < 0 ||
            point.x >= maxBounds.x || point.y >= maxBounds.y) continue;

        // Skip if validation fails (different tile)
        if (!validationFn(point.x, point.y)) continue;

        // Mark as visited and add to filled array
        visited.add(key);
        filled.push(point);

        // Add 4-way neighbors to queue
        queue.push({x: point.x + 1, y: point.y});
        queue.push({x: point.x - 1, y: point.y});
        queue.push({x: point.x, y: point.y + 1});
        queue.push({x: point.x, y: point.y - 1});
    }

    return filled;
}
```

**Complexity**: O(n) where n is the number of filled tiles

**Usage Example**:
```javascript
const boundaryValue = getTileId(startX, startY);
const filledTiles = floodFill(
    {x: startX, y: startY},
    {x: maxTilesX, y: maxTilesY},
    (x, y) => getTileId(x, y) === boundaryValue
);
```

**Optimization**: For large areas, can add progress reporting:
```javascript
if (filled.length % 1000 === 0) {
    // Report progress to UI
    postMessage({action: 'PROGRESS', count: filled.length});
}
```

### 5. Tile Deduplication Algorithm

**Purpose**: Remove duplicate tiles when stamping brush along line

**JavaScript Implementation**:

```javascript
/**
 * Deduplicate array of [x, y] tile coordinates
 * Uses Set with string keys for O(n) performance
 *
 * @param {Array<[number, number]>} tiles - Array of [x, y] coordinates
 * @returns {Array<[number, number]>} Deduplicated array
 */
export function deduplicateTiles(tiles) {
    const seen = new Set();
    const unique = [];

    for (const [x, y] of tiles) {
        const key = `${x},${y}`;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push([x, y]);
        }
    }

    return unique;
}

// Alternative one-liner (less efficient for large arrays):
export function deduplicateTilesShort(tiles) {
    return Array.from(new Set(tiles.map(t => `${t[0]},${t[1]}`)))
        .map(s => s.split(',').map(Number));
}
```

**Complexity**: O(n)

### 6. Tile Comparison Method (isTileSame)

**Purpose**: Compare two tiles for flood fill - must check ALL relevant properties, not just ID

**Source**: Based on `FillTool.cs:86-118` CheckTileMatch method

**Why This is Critical**:
- Tiles with same ID can have different properties (frameX/frameY, slope, color, etc.)
- Simple ID comparison will flood through tiles that look different
- Must match the desktop app's behavior for consistency

**Tile Properties by Layer**:

```javascript
// TILES (blockId):
//   - blockId: The tile type
//   - frameX, frameY: Sprite frame coordinates (for framed tiles like trees, furniture)
//   - slope: Tile shape (0=none, 1-4=slopes, 5=half-block)
//   - blockColor: Paint color applied to tile

// WALLS (wallId):
//   - wallId: The wall type
//   - wallColor: Paint color applied to wall

// WIRES:
//   - wireRed, wireGreen, wireBlue, wireYellow: Boolean for each wire color
//   - actuator: Boolean for actuator presence
//   - actuated: Boolean for actuated state

// LIQUIDS:
//   - liquidType: 0=water, 1=lava, 2=honey, 3=shimmer
//   - liquidAmount: 0-255, amount of liquid in tile
```

**JavaScript Implementation**:

```javascript
/**
 * Check if two tiles match for flood fill purposes
 * Compares all relevant properties based on layer
 *
 * @param {Object} tile1 - First tile to compare
 * @param {Object} tile2 - Second tile to compare
 * @param {string} layer - Layer being filled (TILES, WALLS, WIRES, LIQUIDS)
 * @returns {boolean} True if tiles match for flood fill
 */
export function isTileSame(tile1, tile2, layer) {
    // Helper to safely compare values (handles undefined)
    const eq = (a, b) => (a === undefined && b === undefined) || a === b;

    switch (layer) {
        case 'TILES':
            // Tile must match: ID, slope, and paint color
            // Note: frameX/frameY are reset on tile placement, so we don't compare them
            // They're auto-calculated based on surrounding tiles
            if (!eq(tile1.blockId, tile2.blockId)) return false;
            if (!eq(tile1.slope, tile2.slope)) return false;
            if (!eq(tile1.blockColor, tile2.blockColor)) return false;
            return true;

        case 'WALLS':
            // Wall must match: ID and paint color
            if (!eq(tile1.wallId, tile2.wallId)) return false;
            if (!eq(tile1.wallColor, tile2.wallColor)) return false;
            return true;

        case 'WIRES':
            // Wires must match all wire colors and actuator state
            if (!eq(tile1.wireRed, tile2.wireRed)) return false;
            if (!eq(tile1.wireGreen, tile2.wireGreen)) return false;
            if (!eq(tile1.wireBlue, tile2.wireBlue)) return false;
            if (!eq(tile1.wireYellow, tile2.wireYellow)) return false;
            if (!eq(tile1.actuator, tile2.actuator)) return false;
            if (!eq(tile1.actuated, tile2.actuated)) return false;
            return true;

        case 'LIQUIDS':
            // Liquids must match: type and presence (amount > 0)
            // Don't fill through solid tiles
            if (tile1.blockId !== undefined || tile2.blockId !== undefined) {
                // If either tile is solid, they don't match for liquid fill
                // (This prevents filling through blocks)
                return false;
            }
            const hasLiquid1 = tile1.liquidAmount > 0;
            const hasLiquid2 = tile2.liquidAmount > 0;
            if (hasLiquid1 !== hasLiquid2) return false;
            if (hasLiquid1 && !eq(tile1.liquidType, tile2.liquidType)) return false;
            return true;

        default:
            return false;
    }
}
```

**Complexity**: O(1) - Constant time comparison

**Usage in Flood Fill**:

```javascript
// Get origin tile
const originTile = Worker.worldObject.tiles[startX][startY];

// Use in validation function
const validationFn = (x, y) => {
    if (x < 0 || y < 0 || x >= maxX || y >= maxY) return false;
    const currentTile = Worker.worldObject.tiles[x][y];
    return isTileSame(originTile, currentTile, LAYER);
};

const filledTiles = floodFill(start, maxBounds, validationFn);
```

**Important Notes**:
1. **frameX/frameY**: Not compared because they're auto-calculated during rendering based on surrounding tiles
2. **Liquid solid check**: Must prevent filling through solid blocks
3. **Undefined handling**: Use helper function to treat undefined === undefined as true
4. **Paint colors**: Must match or flood will cross paint boundaries

**Example Scenarios**:

```javascript
// Scenario 1: Same tile ID, different slope - DON'T MATCH
const tile1 = { blockId: 1, slope: 0 };  // Flat dirt
const tile2 = { blockId: 1, slope: 1 };  // Sloped dirt
isTileSame(tile1, tile2, 'TILES');  // false

// Scenario 2: Same tile, different paint - DON'T MATCH
const tile1 = { blockId: 1, blockColor: 0 };   // Unpainted
const tile2 = { blockId: 1, blockColor: 13 };  // Red paint
isTileSame(tile1, tile2, 'TILES');  // false

// Scenario 3: Same everything - MATCH
const tile1 = { blockId: 1, slope: 0, blockColor: 13 };
const tile2 = { blockId: 1, slope: 0, blockColor: 13 };
isTileSame(tile1, tile2, 'TILES');  // true

// Scenario 4: Liquid fill - check type AND prevent solid block fill
const tile1 = { liquidType: 0, liquidAmount: 255 };  // Water
const tile2 = { liquidType: 0, liquidAmount: 200 };  // Water
isTileSame(tile1, tile2, 'LIQUIDS');  // true

const tile3 = { liquidType: 0, liquidAmount: 255 };  // Water
const tile4 = { liquidType: 1, liquidAmount: 255 };  // Lava
isTileSame(tile3, tile4, 'LIQUIDS');  // false

const tile5 = { blockId: 1, liquidType: 0, liquidAmount: 255 };  // Water in solid
const tile6 = { liquidType: 0, liquidAmount: 255 };  // Water in air
isTileSame(tile5, tile6, 'LIQUIDS');  // false (can't fill through solid)
```

**Complexity**: O(1)

## Implementation Workflow

### Phase 1: Geometry Foundation
1. Create `src/utils/geometry/index.js`
2. Implement all 5 algorithms above
3. Write unit tests with known inputs/outputs
4. Verify against C# reference implementation

### Phase 2: Fix Pencil Tool
**File**: `src/canvas/tools/pencil.js`

```javascript
import { drawLine, deduplicateTiles } from "../../utils/geometry/index.js";

const onPencilClick = async (e) => {
    // ... existing code ...

    // ADD: Store starting position for next drag
    Main.listeners.pencilStartX = Main.mousePosImageX;
    Main.listeners.pencilStartY = Main.mousePosImageY;
}

const onPencilDrag = async (e) => {
    if (!Main.listeners.dragging) Main.listeners.dragging = true;

    // REPLACE: Interpolate line instead of single point
    const linePoints = drawLine(
        {x: Main.listeners.pencilStartX, y: Main.listeners.pencilStartY},
        {x: Main.mousePosImageX, y: Main.mousePosImageY}
    );

    // Build tiles array by stamping brush at each line point
    let tilesArray = [];
    const [sizeX, sizeY] = Main.state.optionbar.size;
    const maxX = Main.state.canvas.worldObject.header.maxTilesX;
    const maxY = Main.state.canvas.worldObject.header.maxTilesY;

    linePoints.forEach(point => {
        for (let x = point.x - Math.floor(sizeX/2); x < point.x + Math.ceil(sizeX/2); x++) {
            for (let y = point.y - Math.floor(sizeY/2); y < point.y + Math.ceil(sizeY/2); y++) {
                if (x >= 0 && y >= 0 && x < maxX && y < maxY) {
                    tilesArray.push([x, y]);
                }
            }
        }
    });

    // Deduplicate to prevent double-painting
    tilesArray = deduplicateTiles(tilesArray);

    // ... existing color application code ...

    // UPDATE: Store end position for next drag
    Main.listeners.pencilStartX = Main.mousePosImageX;
    Main.listeners.pencilStartY = Main.mousePosImageY;
}
```

### Phase 3: Brush Tool
**New File**: `src/canvas/tools/brush.js`

```javascript
import { drawLine, fillEllipseCentered, fillRectangleCentered, deduplicateTiles } from "../../utils/geometry/index.js";

function getBrushTiles(center, size, shape) {
    const [width, height] = Array.isArray(size) ? size : [size, size];

    if (shape === "ellipse") {
        return fillEllipseCentered(
            center,
            {x: Math.floor(width/2), y: Math.floor(height/2)}
        ).map(p => [p.x, p.y]);
    } else {
        return fillRectangleCentered(
            center,
            {x: width, y: height}
        ).map(p => [p.x, p.y]);
    }
}

const onBrushClick = async (e) => {
    const shape = Main.state.optionbar.brushShape || "square";
    let tilesArray = getBrushTiles(
        {x: Main.mousePosImageX, y: Main.mousePosImageY},
        Main.state.optionbar.size,
        shape
    );

    // Filter bounds
    const maxX = Main.state.canvas.worldObject.header.maxTilesX;
    const maxY = Main.state.canvas.worldObject.header.maxTilesY;
    tilesArray = tilesArray.filter(([x,y]) => x >= 0 && y >= 0 && x < maxX && y < maxY);

    // Apply colors (reuse from pencil)
    // ...
}

const onBrushDrag = async (e) => {
    // Same pattern as fixed pencil, but use getBrushTiles
}
```

### Phase 4: Enhanced Eraser
Apply same changes as pencil to `src/canvas/tools/eraser.js`

### Phase 5: Bucket Fill
**File**: `src/canvas/workerInterfaces/worker/editTiles.js`

Replace commented section (lines 98-167) with proper tile comparison:

```javascript
else if (editType == "floodfill") {
    const startX = editArgs[0];
    const startY = editArgs[1];

    // Import isTileSame from geometry utils
    // (or inline the function here in the worker)

    // Helper to safely compare tile properties
    function isTileSame(tile1, tile2, layer) {
        const eq = (a, b) => (a === undefined && b === undefined) || a === b;

        switch (layer) {
            case LAYERS.TILES:
                // Compare blockId, slope, and blockColor
                if (!eq(tile1.blockId, tile2.blockId)) return false;
                if (!eq(tile1.slope, tile2.slope)) return false;
                if (!eq(tile1.blockColor, tile2.blockColor)) return false;
                return true;

            case LAYERS.WALLS:
                // Compare wallId and wallColor
                if (!eq(tile1.wallId, tile2.wallId)) return false;
                if (!eq(tile1.wallColor, tile2.wallColor)) return false;
                return true;

            case LAYERS.WIRES:
                // Compare all wire colors and actuator state
                if (!eq(tile1.wireRed, tile2.wireRed)) return false;
                if (!eq(tile1.wireGreen, tile2.wireGreen)) return false;
                if (!eq(tile1.wireBlue, tile2.wireBlue)) return false;
                if (!eq(tile1.wireYellow, tile2.wireYellow)) return false;
                if (!eq(tile1.actuator, tile2.actuator)) return false;
                if (!eq(tile1.actuated, tile2.actuated)) return false;
                return true;

            case LAYERS.LIQUIDS:
                // Don't fill through solid blocks
                if (tile1.blockId !== undefined || tile2.blockId !== undefined) {
                    return false;
                }
                // Compare liquid type and presence
                const hasLiquid1 = (tile1.liquidAmount || 0) > 0;
                const hasLiquid2 = (tile2.liquidAmount || 0) > 0;
                if (hasLiquid1 !== hasLiquid2) return false;
                if (hasLiquid1 && !eq(tile1.liquidType, tile2.liquidType)) return false;
                return true;

            default:
                return false;
        }
    }

    // Get origin tile (ALL properties, not just ID)
    const originTile = Worker.worldObject.tiles[startX][startY];

    // Check if already filled with target - compare just the relevant property
    let alreadyFilled = false;
    switch(LAYER) {
        case LAYERS.TILES:
            alreadyFilled = originTile.blockId === newId;
            break;
        case LAYERS.WALLS:
            alreadyFilled = originTile.wallId === newId;
            break;
        case LAYERS.LIQUIDS:
            alreadyFilled = originTile.liquidType === newId && originTile.liquidAmount > 0;
            break;
    }

    if (alreadyFilled) {
        postMessage({ action: "RETURN_EDIT_TILES" });
        return;
    }

    // Flood fill with proper tile comparison
    const visited = new Set();
    const queue = [{x: startX, y: startY}];
    const tilesArray = [];
    const maxX = Worker.worldObject.header.maxTilesX;
    const maxY = Worker.worldObject.header.maxTilesY;

    while (queue.length > 0) {
        const {x, y} = queue.shift();
        const key = `${x},${y}`;

        // Skip if already visited
        if (visited.has(key)) continue;

        // Skip if out of bounds
        if (x < 0 || y < 0 || x >= maxX || y >= maxY) continue;

        const currentTile = Worker.worldObject.tiles[x][y];

        // Skip if tile doesn't match origin (checks ALL properties)
        if (!isTileSame(originTile, currentTile, LAYER)) continue;

        // Mark as visited
        visited.add(key);

        // Change the tile
        changeTile(LAYER, x, y, newId);
        tilesArray.push([x, y]);

        // Add 4-way neighbors to queue
        queue.push({x: x+1, y: y});
        queue.push({x: x-1, y: y});
        queue.push({x: x, y: y+1});
        queue.push({x: x, y: y-1});

        // Optional: Progress reporting for large fills
        if (tilesArray.length % 1000 === 0) {
            console.log(`Filled ${tilesArray.length} tiles...`);
        }
    }

    postMessage({
        action: "RETURN_EDIT_TILES",
        tilesArray
    });
}
```

### Phase 6: Rectangle Selection

**State** (`src/state/state.js`):
```javascript
selection: {
    active: false,
    x1: 0, y1: 0,
    x2: 0, y2: 0
}
```

**Tool** (`src/canvas/tools/selection.js`):
- MouseDown: Start selection, clear on right-click
- MouseMove: Update selection bounds
- MouseUp: Finalize selection

**Rendering** (`src/canvas/main.js`):
```javascript
this.loop.drawSelection = () => {
    if (!this.state.selection.active) return;

    const x1 = (this.state.selection.x1 - this.posX) * this.tilePixelRatio;
    const y1 = (this.state.selection.y1 - this.posY) * this.tilePixelRatio;
    const x2 = (this.state.selection.x2 - this.posX) * this.tilePixelRatio;
    const y2 = (this.state.selection.y2 - this.posY) * this.tilePixelRatio;

    this.ctx.strokeStyle = "rgba(0, 120, 255, 0.9)";
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = "rgba(0, 120, 255, 0.15)";
    this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
}
```

**Validation** (all tools):
```javascript
function isInSelection(x, y) {
    if (!Main.state.selection.active) return true;
    return x >= Main.state.selection.x1 && x <= Main.state.selection.x2 &&
           y >= Main.state.selection.y1 && y <= Main.state.selection.y2;
}

// Filter tiles in each tool:
tilesArray = tilesArray.filter(([x,y]) => isInSelection(x, y));
```

## Testing Strategy

### Unit Tests
```javascript
describe('drawLine', () => {
    it('should draw horizontal line', () => {
        const points = drawLine({x: 0, y: 0}, {x: 5, y: 0});
        expect(points).toHaveLength(6);
        expect(points[0]).toEqual({x: 0, y: 0});
        expect(points[5]).toEqual({x: 5, y: 0});
    });

    it('should draw diagonal line', () => {
        const points = drawLine({x: 0, y: 0}, {x: 5, y: 5});
        expect(points).toHaveLength(6);
        expect(points[3]).toEqual({x: 3, y: 3});
    });
});

describe('fillEllipseCentered', () => {
    it('should fill 5x5 circle', () => {
        const points = fillEllipseCentered({x: 10, y: 10}, {x: 2, y: 2});
        expect(points.length).toBeGreaterThan(12);
        expect(points.length).toBeLessThan(20);
    });
});

describe('floodFill', () => {
    it('should fill 3x3 area', () => {
        const grid = [[1,1,1], [1,1,1], [1,1,1]];
        const validationFn = (x, y) => grid[y]?.[x] === 1;
        const points = floodFill({x:1, y:1}, {x:3, y:3}, validationFn);
        expect(points).toHaveLength(9);
    });

    it('should respect boundaries', () => {
        const grid = [[1,0,1], [1,1,1], [1,0,1]];
        const validationFn = (x, y) => grid[y]?.[x] === 1;
        const points = floodFill({x:1, y:1}, {x:3, y:3}, validationFn);
        expect(points).toHaveLength(5); // Center cross only
    });
});
```

### Integration Tests
1. Load small map, draw fast diagonal - no gaps
2. Use 50x50 brush - verify all tiles filled
3. Bucket fill large area - completes without crash
4. Selection constrains tools correctly

## Performance Targets

- **Line interpolation**: <1ms for 100-pixel drag
- **Brush stamp**: <5ms for 100x100 brush
- **Flood fill**: <500ms for 1000-tile area
- **Selection**: <16ms render time at 60fps

## File Checklist

### New Files
- [ ] `src/utils/geometry/index.js`
- [ ] `src/canvas/tools/brush.js`
- [ ] `src/canvas/tools/selection.js`
- [ ] `src/utils/selection.js`
- [ ] `src/components/optionbar/brushShape.jsx`

### Modified Files
- [ ] `src/canvas/tools/pencil.js`
- [ ] `src/canvas/tools/eraser.js`
- [ ] `src/canvas/workerInterfaces/worker/editTiles.js`
- [ ] `src/canvas/main.js`
- [ ] `src/canvas/listeners/click.js`
- [ ] `src/canvas/listeners/mousemove.js`
- [ ] `src/canvas/listeners/mousedown.js`
- [ ] `src/canvas/listeners/mouseup.js`
- [ ] `src/state/state.js`
- [ ] `src/app/tools.js`
- [ ] `src/components/optionbar.jsx`
- [ ] `src/components/icon.jsx`

## References

- Desktop implementation: `D:\dev\ai\tedit\Terraria-Map-Editor\src\TEdit\Editor\Tools`
- Geometry algorithms: `D:\dev\ai\tedit\Terraria-Map-Editor\src\TEdit.Common\Geometry`
- Bresenham's algorithm: Shape.cs lines 7-72
- Ellipse fill: Fill.cs lines 73-191
- Flood fill: Fill.cs lines 294-366
