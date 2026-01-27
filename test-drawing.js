/**
 * Manual test script to verify drawing algorithm
 */

// Simulate geometry functions
const drawLine = (start, end) => {
    const points = [];
    if (!start || !end) return points;

    let x0 = Math.floor(start.x ?? 0);
    let y0 = Math.floor(start.y ?? 0);
    let x1 = Math.floor(end.x ?? 0);
    let y1 = Math.floor(end.y ?? 0);

    if (x0 === x1 && y0 === y1) {
        return [{x: x0, y: y0}];
    }

    let dy = y1 - y0;
    let dx = x1 - x0;
    let stepx, stepy;

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

    dy = dy << 1;
    dx = dx << 1;

    points.push({x: x0, y: y0});

    if (dx > dy) {
        let fraction = dy - (dx >> 1);
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
};

const fillRectangleCentered = (center, size) => {
    const points = [];
    if (!center || !size) return points;

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
};

// Test 1: Line drawing
console.log("=== Test 1: Horizontal line from (0,0) to (5,0) ===");
const line1 = drawLine({x: 0, y: 0}, {x: 5, y: 0});
console.log("Points:", line1);
console.log("Expected: 6 points (0-5 on same line)");
console.log("Actual:", line1.length, "points");
console.log("All on y=0?", line1.every(p => p.y === 0));
console.log("");

// Test 2: Vertical line
console.log("=== Test 2: Vertical line from (0,0) to (0,5) ===");
const line2 = drawLine({x: 0, y: 0}, {x: 0, y: 5});
console.log("Points:", line2);
console.log("Expected: 6 points on same x");
console.log("Actual:", line2.length, "points");
console.log("All on x=0?", line2.every(p => p.x === 0));
console.log("");

// Test 3: Diagonal line
console.log("=== Test 3: Diagonal line from (0,0) to (5,5) ===");
const line3 = drawLine({x: 0, y: 0}, {x: 5, y: 5});
console.log("Points:", line3);
console.log("Expected: ~6-7 points from (0,0) to (5,5)");
console.log("Actual:", line3.length, "points");
console.log("First point:", line3[0]);
console.log("Last point:", line3[line3.length - 1]);
console.log("");

// Test 4: Rectangle fill
console.log("=== Test 4: 3x3 rectangle centered at (5,5) ===");
const rect1 = fillRectangleCentered({x: 5, y: 5}, {x: 3, y: 3});
console.log("Count:", rect1.length);
console.log("Expected: 9 tiles (3x3)");
console.log("Tiles:", rect1);
console.log("");

// Test 5: Simulating click -> drag -> drag flow
console.log("=== Test 5: Click-Drag-Drag flow ===");
console.log("1. Click at (10,10)");
const clickTiles = fillRectangleCentered({x: 10, y: 10}, {x: 3, y: 3});
console.log("   Brush tiles:", clickTiles.length);

console.log("2. Drag to (15,15)");
const lineFromClick = drawLine({x: 10, y: 10}, {x: 15, y: 15});
console.log("   Line points:", lineFromClick.length, "points");
let dragTiles1 = [];
lineFromClick.forEach(point => {
    const brushTiles = fillRectangleCentered(point, {x: 3, y: 3});
    dragTiles1.push(...brushTiles);
});
console.log("   Total brush stamps along line:", dragTiles1.length);

console.log("3. Drag to (20,20)");
const lineFromPrev = drawLine({x: 15, y: 15}, {x: 20, y: 20});
console.log("   Line points:", lineFromPrev.length, "points");
let dragTiles2 = [];
lineFromPrev.forEach(point => {
    const brushTiles = fillRectangleCentered(point, {x: 3, y: 3});
    dragTiles2.push(...brushTiles);
});
console.log("   Total brush stamps along line:", dragTiles2.length);
console.log("");

// Test 6: Check for invalid parameters
console.log("=== Test 6: Edge cases ===");
const emptyLine = drawLine(null, {x: 5, y: 5});
console.log("drawLine(null, {x:5, y:5}):", emptyLine);

const emptyRect = fillRectangleCentered(null, {x: 5, y: 5});
console.log("fillRectangleCentered(null, {x:5, y:5}):", emptyRect);

const samePoint = drawLine({x: 5, y: 5}, {x: 5, y: 5});
console.log("drawLine({x:5, y:5}, {x:5, y:5}):", samePoint);
