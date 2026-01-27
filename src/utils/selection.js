/**
 * Check if a tile is within the current selection
 *
 * @param {number} x - Tile X coordinate
 * @param {number} y - Tile Y coordinate
 * @param {Object} selectionState - Selection state from Redux
 * @returns {boolean} True if tile is in selection or selection is inactive
 */
export function isInSelection(x, y, selectionState) {
    // If selection state is undefined or inactive, allow all tiles
    if (!selectionState || !selectionState.active) return true;

    return x >= selectionState.x1 && x <= selectionState.x2 &&
           y >= selectionState.y1 && y <= selectionState.y2;
}
