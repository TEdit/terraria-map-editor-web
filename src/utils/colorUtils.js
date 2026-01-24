/**
 * Color utility functions for converting various color formats to CSS
 */

/**
 * Converts single RGBA object to CSS rgba() string
 * @param {Object} rgba - RGBA object with r, g, b, a properties (0-255 range)
 * @returns {string} CSS rgba() string
 */
function rgbaToCss(rgba) {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a / 255})`;
}

/**
 * Converts various color formats to CSS color string or gradient
 * @param {string|Object|Array} color - Color in various formats:
 *   - Hex string: "#FF4040"
 *   - RGBA object: {r: 255, g: 64, b: 64, a: 255}
 *   - Array of RGBA objects: [{r,g,b,a}, {r,g,b,a}, ...]
 *   - null/undefined
 * @returns {string|null} CSS color string, gradient, or null
 */
export function toCssColor(color) {
    if (!color) return null;

    // Array of colors - create gradient with hard edges
    if (Array.isArray(color)) {
        if (color.length === 0) return null;
        if (color.length === 1) return toCssColor(color[0]);

        // Create gradient with hard edges for distinct color sections
        const stops = color.map((c, i) => {
            const cssColor = toCssColor(c);
            const percent1 = (i / color.length * 100).toFixed(2);
            const percent2 = ((i + 1) / color.length * 100).toFixed(2);
            return `${cssColor} ${percent1}% ${percent2}%`;
        });

        return `linear-gradient(to right, ${stops.join(', ')})`;
    }

    // Hex string
    if (typeof color === 'string') return color;

    // RGBA object
    if (color.r !== undefined) return rgbaToCss(color);

    return null;
}
