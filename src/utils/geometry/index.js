/**
 * Geometry utilities for drawing algorithms
 * Ported from C# TEdit reference implementation
 */

/**
 * Bresenham's line drawing algorithm
 * Generates all pixels along a line from start to end
 *
 * @param {Object} start - Starting point {x, y}
 * @param {Object} end - Ending point {x, y}
 * @returns {Array<{x, y}>} Array of all points along the line
 */
export function drawLine(start, end) {
    const points = [];

    // Defensive checks for null/undefined parameters
    if (!start || !end) {
        return points;
    }

    let x0 = Math.floor(start.x ?? 0);
    let y0 = Math.floor(start.y ?? 0);
    let x1 = Math.floor(end.x ?? 0);
    let y1 = Math.floor(end.y ?? 0);

    // Handle edge case: start and end are the same point
    if (x0 === x1 && y0 === y1) {
        return [{x: x0, y: y0}];
    }

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

/**
 * Fill a rectangle centered at a point
 *
 * @param {Object} center - Center point {x, y}
 * @param {Object} size - Size {x: width, y: height}
 * @returns {Array<{x, y}>} Array of all points filling the rectangle
 */
export function fillRectangleCentered(center, size) {
    const points = [];

    if (!center || !size) {
        return points;
    }

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

/**
 * Midpoint ellipse algorithm - fills ellipse centered at a point
 * Uses integer-only arithmetic for performance
 *
 * @param {Object} center - Center point {x, y}
 * @param {Object} radius - Radius {x: radiusX, y: radiusY}
 * @returns {Array<{x, y}>} Array of all points filling the ellipse
 */
export function fillEllipseCentered(center, radius) {
    const points = [];

    if (!center || !radius) {
        return points;
    }

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
