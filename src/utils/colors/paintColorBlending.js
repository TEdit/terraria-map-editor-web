/**
 * Paint color blending utilities matching C# TEdit PixelMap implementation
 * Reference: TEdit.Render.PixelMap.GetTileColor()
 */

/**
 * Convert hex color string to RGBA object
 * @param {string} hexString - Hex color in #RRGGBB format
 * @returns {{r: number, g: number, b: number, a: number}} RGBA object with values 0-255
 */
export function hexToRgba(hexString, alpha = -1) {
    if (!hexString || typeof hexString !== 'string') {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Remove # prefix if present
    const hex = hexString.startsWith('#') ? hexString.slice(1) : hexString;

    // Validate hex format (6 or 8 characters for RGB or RGBA)
    if ((hex.length !== 6 && hex.length !== 8) || !/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
        return { r: 0, g: 0, b: 0, a: 0 };
    }

    // Extract alpha from hex if 8 characters (RGBA format)
    if (hex.length === 8 && alpha < 0) {
        alpha = parseInt(hex.slice(6, 8), 16);
    }

    return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: alpha >= 0 ? alpha : 255
    };
}

/**
 * Alpha blend foreground color over background color
 * Matches C# AlphaBlend formula from PixelMap
 * @param {{r: number, g: number, b: number, a: number}} background - Background color
 * @param {{r: number, g: number, b: number, a: number}} foreground - Foreground color with alpha
 * @returns {{r: number, g: number, b: number, a: number}} Blended color
 */
export function alphaBlend(background, foreground) {
    const alpha = foreground.a / 255;
    return {
        r: Math.floor(alpha * foreground.r + (1 - alpha) * background.r),
        g: Math.floor(alpha * foreground.g + (1 - alpha) * background.g),
        b: Math.floor(alpha * foreground.b + (1 - alpha) * background.b),
        a: background.a
    };
}

/**
 * Apply brightness multiplier to color RGB channels
 * @param {{r: number, g: number, b: number, a: number}} color - Input color
 * @param {number} brightness - Brightness value 0-255
 * @returns {{r: number, g: number, b: number, a: number}} Color with brightness applied
 */
export function applyBrightness(color, brightness) {
    const factor = brightness / 255;
    return {
        r: Math.floor(color.r * factor),
        g: Math.floor(color.g * factor),
        b: Math.floor(color.b * factor),
        a: color.a
    };
}

/**
 * Get coating brightness value based on tile coating properties
 * Matches C# PixelMap coating logic
 * @param {boolean} hasInvisible - Has invisible/echo coating
 * @param {boolean} hasFullBright - Has illuminant coating
 * @returns {number} Brightness value: 169 (echo), 211 (normal), 255 (illuminant)
 */
export function getCoatingBrightness(hasInvisible, hasFullBright) {
    // C# reference:
    // brightness = 211;
    // if (tile.InvisibleBlock) { brightness = 169; }
    // if (tile.FullBrightBlock) { brightness = 255; }

    if (hasFullBright === true) return 255; // Illuminant coating
    if (hasInvisible === true) return 169;  // Echo coating
    return 211; // Normal (no coating)
}

/**
 * Apply special paint transformation (Shadow ID 29, Negative ID 30)
 * These paints modify the base color rather than rendering as a separate layer
 * @param {{r: number, g: number, b: number, a: number}} baseColor - Base tile/wall color
 * @param {number} paintId - Paint ID (29 or 30)
 * @param {number} brightness - Coating brightness (169, 211, or 255)
 * @param {boolean} isWall - Whether this is a wall
 * @returns {{r: number, g: number, b: number, a: number}} Transformed color
 */
export function applySpecialPaint(baseColor, paintId, brightness, isWall) {
    // Shadow Paint (ID 29)
    // C# Reference: float light = c.B * 0.3f * (brightness / 255.0f);
    if (paintId === 29) {
        const light = (baseColor.b / 255) * 0.3 * (brightness / 255);
        return {
            r: Math.floor(baseColor.r * light),
            g: Math.floor(baseColor.g * light),
            b: Math.floor(baseColor.b * light),
            a: baseColor.a
        };
    }

    // Negative Paint (ID 30)
    // C# Reference: Walls use 50% inverted, tiles use 100% inverted
    if (paintId === 30) {
        if (isWall) {
            // Walls use 50% inverted color with brightness
            const factor = 0.5 * (brightness / 255);
            return {
                r: Math.floor((255 - baseColor.r) * factor),
                g: Math.floor((255 - baseColor.g) * factor),
                b: Math.floor((255 - baseColor.b) * factor),
                a: baseColor.a
            };
        } else {
            // Tiles use full inversion with brightness
            const factor = brightness / 255;
            return {
                r: Math.floor((255 - baseColor.r) * factor),
                g: Math.floor((255 - baseColor.g) * factor),
                b: Math.floor((255 - baseColor.b) * factor),
                a: baseColor.a
            };
        }
    }

    // Should not reach here - return base color unchanged
    return baseColor;
}

/**
 * Apply paint color to tile/wall with brightness, matching C# PixelMap logic
 * @param {{r: number, g: number, b: number, a: number}} baseColor - Base tile or wall color
 * @param {{r: number, g: number, b: number, a: number}} paintColor - Paint color (RGBA)
 * @param {number} paintId - Paint ID (0-31)
 * @param {number} brightness - Brightness value from coating (169, 211, or 255)
 * @param {boolean} isWall - Whether this is a wall (affects negative paint)
 * @returns {{r: number, g: number, b: number, a: number}} Painted color
 */
export function paintTileColor(baseColor, paintColor, paintId, brightness, isWall) {
    // Validate inputs
    if (!baseColor || !paintColor) {
        return baseColor || { r: 0, g: 0, b: 0, a: 0 };
    }

    // Paint ID 31 is legacy illuminant paint - skip
    if (paintId < 0 || paintId > 31 || paintId === 31 || paintId === 0) {
        return baseColor;
    }

    // C# Reference: Shadow Paint (ID 29)
    // float light = c.B * 0.3f * (brightness / 255.0f);
    // c.R = (byte)(c.R * light);
    // c.G = (byte)(c.G * light);
    // c.B = (byte)(c.B * light);
    if (paintId === 29) {
        const light = (baseColor.b / 255) * 0.3 * (brightness / 255);
        return {
            r: Math.floor(baseColor.r * light),
            g: Math.floor(baseColor.g * light),
            b: Math.floor(baseColor.b * light),
            a: baseColor.a
        };
    }

    // C# Reference: Negative Paint (ID 30)
    // Walls: ((255 - c) * 0.5 * (brightness / 255))
    // Tiles: (255 - c) then brightness applied separately
    if (paintId === 30) {
        if (isWall) {
            // Walls use 50% inverted color with brightness
            const factor = 0.5 * (brightness / 255);
            return {
                r: Math.floor((255 - baseColor.r) * factor),
                g: Math.floor((255 - baseColor.g) * factor),
                b: Math.floor((255 - baseColor.b) * factor),
                a: baseColor.a
            };
        } else {
            // Tiles use full inversion with brightness
            const factor = brightness / 255;
            return {
                r: Math.floor((255 - baseColor.r) * factor),
                g: Math.floor((255 - baseColor.g) * factor),
                b: Math.floor((255 - baseColor.b) * factor),
                a: baseColor.a
            };
        }
    }

    // C# Reference: Normal paints (IDs 1-28)
    // paint.A = (byte)brightness;
    // c = c.AlphaBlend(paint);
    const paint = { ...paintColor, a: brightness };
    return alphaBlend(baseColor, paint);
}
