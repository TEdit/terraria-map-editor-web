import { hexToRgba } from "../colors/paintColorBlending.js";

const PAINTS = [
    { id: 0, name: "None", color: "#000000" },
    // Non-deep paints, lightened ~25% toward white
    { id: 1, name: "Red", color: "#FF4040" },
    { id: 2, name: "Orange", color: "#FF9F40" },
    { id: 3, name: "Yellow", color: "#FFFF40" },
    { id: 4, name: "Lime", color: "#9FFF40" },
    { id: 5, name: "Green", color: "#40FF40" },
    { id: 6, name: "Teal", color: "#40FF9F" },
    { id: 7, name: "Cyan", color: "#40FFFF" },
    { id: 8, name: "Sky Blue", color: "#409FFF" },
    { id: 9, name: "Blue", color: "#4040FF" },
    { id: 10, name: "Purple", color: "#9F40FF" },
    { id: 11, name: "Violet", color: "#FF40FF" },
    { id: 12, name: "Pink", color: "#FF409F" },
    // Deep paints
    { id: 13, name: "Deep Red", color: "#FF0000" },
    { id: 14, name: "Deep Orange", color: "#FF7F00" },
    { id: 15, name: "Deep Yellow", color: "#FFFF00" },
    { id: 16, name: "Deep Lime", color: "#7FFF00" },
    { id: 17, name: "Deep Green", color: "#00FF00" },
    { id: 18, name: "Deep Teal", color: "#00FF7F" },
    { id: 19, name: "Deep Cyan", color: "#00FFFF" },
    { id: 20, name: "Deep Sky Blue", color: "#007FFF" },
    { id: 21, name: "Deep Blue", color: "#0000FF" },
    { id: 22, name: "Deep Purple", color: "#7F00FF" },
    { id: 23, name: "Deep Violet", color: "#FF00FF" },
    { id: 24, name: "Deep Pink", color: "#FF007F" },
    { id: 25, name: "Black", color: "#4B4B4B" },
    { id: 26, name: "White", color: "#FFFFFF" },
    { id: 27, name: "Gray", color: "#AFAFAF" },
    { id: 28, name: "Brown", color: "#FFB27D" },
    { id: 29, name: "Shadow", color: "#191919" },
    { id: 30, name: "Negative", color: "#FFFFFF" },
    { id: 31, name: "Illuminant Paint (legacy)", color: "#FFFFFF" }
];

// Pre-compute RGBA objects for performance (avoids hex parsing during rendering)
const PAINTS_WITH_RGBA = PAINTS.map(paint => ({
    ...paint,
    rgba: hexToRgba(paint.color, 211) // default alpha 211 for paint colors
}));

// Create paint colors array indexed by paint ID
// PAINT_COLORS_BY_ID[paintId] = {r, g, b, a}
const PAINT_COLORS_BY_ID = PAINTS_WITH_RGBA.map(paint => paint.rgba);

export default Object.freeze(PAINTS_WITH_RGBA);
export { PAINT_COLORS_BY_ID };
