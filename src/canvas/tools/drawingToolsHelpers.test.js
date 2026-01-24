/**
 * Unit tests for drawing tool helpers
 * Tests the shared click/drag/up handlers used by pencil and eraser tools
 */

import {
    getBrushTiles,
    getFilteredTiles,
    onDrawingToolClick,
    onDrawingToolDrag,
    onDrawingToolUp
} from './drawingToolsHelpers.js';

// Mock Main object
const createMockMain = () => ({
    mousePosImageX: 10,
    mousePosImageY: 10,
    listeners: {
        dragging: false,
        drawingStartX: undefined,
        drawingStartY: undefined
    },
    state: {
        optionbar: {
            size: [5, 5],
            layer: 0,
            brushShape: 'square'
        },
        canvas: {
            worldObject: {
                header: {
                    maxTilesX: 100,
                    maxTilesY: 100
                }
            }
        },
        selection: {
            active: false
        }
    },
    layersImages: {
        0: {
            data: new Uint8ClampedArray(100 * 100 * 4)
        }
    },
    updateLayers: vi.fn(),
    workerInterfaces: {
        editTiles: vi.fn().mockResolvedValue({})
    }
});

// Mock store
const createMockStore = () => ({
    dispatch: vi.fn()
});

describe('getBrushTiles', () => {
    test('should return square tiles for square shape', () => {
        const tiles = getBrushTiles({x: 10, y: 10}, [5, 5], 'square');
        expect(tiles.length).toBe(25); // 5x5 = 25 tiles
        expect(tiles).toContainEqual([10, 10]); // Center tile
    });

    test('should return circle tiles for circle shape', () => {
        const tiles = getBrushTiles({x: 10, y: 10}, [5, 5], 'circle');
        expect(tiles.length).toBeGreaterThan(0);
        expect(tiles.length).toBeLessThan(25); // Circle < square
        expect(tiles).toContainEqual([10, 10]); // Center should be included
    });

    test('should return ellipse tiles for ellipse shape', () => {
        const tiles = getBrushTiles({x: 10, y: 10}, [5, 5], 'ellipse');
        expect(tiles.length).toBeGreaterThan(0);
        expect(tiles.length).toBeLessThan(25); // Ellipse < square
    });

    test('should handle single number size', () => {
        const tiles = getBrushTiles({x: 0, y: 0}, 3, 'square');
        expect(tiles.length).toBe(9); // 3x3
    });

    test('should handle rectangular brush', () => {
        const tiles = getBrushTiles({x: 0, y: 0}, [3, 5], 'square');
        expect(tiles.length).toBe(15); // 3x5 = 15
    });

    test('should handle 1x1 brush', () => {
        const tiles = getBrushTiles({x: 5, y: 5}, [1, 1], 'square');
        expect(tiles.length).toBe(1);
        expect(tiles[0]).toEqual([5, 5]);
    });
});

describe('getFilteredTiles', () => {
    // Create mock Main for selection tests
    let mockMain;

    beforeEach(() => {
        mockMain = createMockMain();
        global.Main = mockMain;
    });

    test('should filter out of bounds tiles (negative coordinates)', () => {
        const tiles = [[-1, 0], [0, 0], [1, 1]];
        const filtered = getFilteredTiles(tiles, 50, 50);
        expect(filtered).not.toContainEqual([-1, 0]);
        expect(filtered).toContainEqual([0, 0]);
        expect(filtered).toContainEqual([1, 1]);
    });

    test('should filter out of bounds tiles (beyond max)', () => {
        const tiles = [[0, 0], [50, 50], [100, 100]];
        const filtered = getFilteredTiles(tiles, 50, 50);
        expect(filtered).toContainEqual([0, 0]);
        expect(filtered).not.toContainEqual([50, 50]); // At boundary (exclusive)
        expect(filtered).not.toContainEqual([100, 100]);
    });

    test('should keep all tiles when selection is inactive', () => {
        mockMain.state.selection.active = false;
        const tiles = [[0, 0], [10, 10], [20, 20]];
        const filtered = getFilteredTiles(tiles, 50, 50);
        expect(filtered.length).toBe(3);
    });

    test('should filter tiles outside selection when active', () => {
        mockMain.state.selection = {
            active: true,
            x1: 5, y1: 5,
            x2: 15, y2: 15
        };
        const tiles = [[0, 0], [10, 10], [20, 20]];
        const filtered = getFilteredTiles(tiles, 50, 50);
        expect(filtered).not.toContainEqual([0, 0]); // Outside selection
        expect(filtered).toContainEqual([10, 10]); // Inside selection
        expect(filtered).not.toContainEqual([20, 20]); // Outside selection
    });

    test('should handle empty tiles array', () => {
        const filtered = getFilteredTiles([], 50, 50);
        expect(filtered).toEqual([]);
    });
});

describe('onDrawingToolClick', () => {
    let mockMain, mockStore, mockOperation;

    beforeEach(() => {
        mockMain = createMockMain();
        mockStore = createMockStore();
        mockOperation = vi.fn().mockResolvedValue();

        global.Main = mockMain;
        global.store = mockStore;
    });

    test('should set drawing start position', async () => {
        mockMain.mousePosImageX = 15;
        mockMain.mousePosImageY = 25;

        await onDrawingToolClick(mockOperation);

        expect(mockMain.listeners.drawingStartX).toBe(15);
        expect(mockMain.listeners.drawingStartY).toBe(25);
    });

    test('should call operation with tiles array and layer', async () => {
        await onDrawingToolClick(mockOperation);

        expect(mockOperation).toHaveBeenCalled();
        const [tilesArray, layer] = mockOperation.mock.calls[0];
        expect(Array.isArray(tilesArray)).toBe(true);
        expect(tilesArray.length).toBeGreaterThan(0);
        expect(layer).toBe(0);
    });

    test('should handle missing state gracefully', async () => {
        mockMain.state = null;
        await expect(onDrawingToolClick(mockOperation)).resolves.not.toThrow();
        expect(mockOperation).not.toHaveBeenCalled();
    });

    test('should handle missing optionbar', async () => {
        mockMain.state.optionbar = null;
        await expect(onDrawingToolClick(mockOperation)).resolves.not.toThrow();
        expect(mockOperation).not.toHaveBeenCalled();
    });

    test('should handle missing canvas', async () => {
        mockMain.state.canvas = null;
        await expect(onDrawingToolClick(mockOperation)).resolves.not.toThrow();
        expect(mockOperation).not.toHaveBeenCalled();
    });

    test('should skip if already dragging', async () => {
        mockMain.listeners.dragging = true;
        await onDrawingToolClick(mockOperation);

        expect(mockOperation).not.toHaveBeenCalled();
        expect(mockMain.listeners.dragging).toBe(false); // Reset flag
    });

    test('should not call operation if tilesArray is empty', async () => {
        // Position outside bounds to generate empty tilesArray
        mockMain.mousePosImageX = -100;
        mockMain.mousePosImageY = -100;

        await onDrawingToolClick(mockOperation);

        expect(mockOperation).not.toHaveBeenCalled();
    });

    test('should dispatch loading state changes', async () => {
        await onDrawingToolClick(mockOperation);

        // Should dispatch loading true and false
        expect(mockStore.dispatch).toHaveBeenCalled();
        const calls = mockStore.dispatch.mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle operation errors gracefully', async () => {
        const errorOperation = vi.fn().mockRejectedValue(new Error('Test error'));

        await expect(onDrawingToolClick(errorOperation)).resolves.not.toThrow();
        // Should still dispatch loading false
        expect(mockStore.dispatch).toHaveBeenCalled();
    });

    test('should handle undefined mouse position', async () => {
        mockMain.mousePosImageX = undefined;
        mockMain.mousePosImageY = undefined;

        await expect(onDrawingToolClick(mockOperation)).resolves.not.toThrow();
        expect(mockMain.listeners.drawingStartX).toBe(0); // Falls back to 0
        expect(mockMain.listeners.drawingStartY).toBe(0);
    });
});

describe('onDrawingToolDrag', () => {
    let mockMain, mockStore, mockOperation;

    beforeEach(() => {
        mockMain = createMockMain();
        mockStore = createMockStore();
        mockOperation = vi.fn().mockResolvedValue();

        global.Main = mockMain;
        global.store = mockStore;

        // Set up initial drawing position
        mockMain.listeners.drawingStartX = 10;
        mockMain.listeners.drawingStartY = 10;
    });

    test('should set dragging flag', async () => {
        expect(mockMain.listeners.dragging).toBe(false);
        await onDrawingToolDrag(mockOperation);
        expect(mockMain.listeners.dragging).toBe(true);
    });

    test('should interpolate line between start and current', async () => {
        mockMain.mousePosImageX = 20;
        mockMain.mousePosImageY = 20;

        await onDrawingToolDrag(mockOperation);

        expect(mockOperation).toHaveBeenCalled();
        const [tilesArray] = mockOperation.mock.calls[0];
        // Should be more than a single 5x5 stamp due to line interpolation
        expect(tilesArray.length).toBeGreaterThan(25);
    });

    test('should update start position after drag', async () => {
        mockMain.mousePosImageX = 20;
        mockMain.mousePosImageY = 20;

        await onDrawingToolDrag(mockOperation);

        expect(mockMain.listeners.drawingStartX).toBe(20);
        expect(mockMain.listeners.drawingStartY).toBe(20);
    });

    test('should handle missing state gracefully', async () => {
        mockMain.state = null;
        await expect(onDrawingToolDrag(mockOperation)).resolves.not.toThrow();
        expect(mockOperation).not.toHaveBeenCalled();
    });

    test('should handle errors gracefully', async () => {
        const errorOperation = vi.fn().mockRejectedValue(new Error('Test error'));

        await expect(onDrawingToolDrag(errorOperation)).resolves.not.toThrow();
        expect(mockStore.dispatch).toHaveBeenCalled();
    });

    test('should deduplicate tiles from line interpolation', async () => {
        // Slow drag (same position) should not create duplicates
        mockMain.mousePosImageX = 10;
        mockMain.mousePosImageY = 10;

        await onDrawingToolDrag(mockOperation);

        const [tilesArray] = mockOperation.mock.calls[0];
        // Check no exact duplicates
        const uniqueTiles = new Set(tilesArray.map(([x, y]) => `${x},${y}`));
        expect(uniqueTiles.size).toBe(tilesArray.length);
    });

    test('should work with circle brush shape', async () => {
        mockMain.state.optionbar.brushShape = 'circle';
        mockMain.mousePosImageX = 15;
        mockMain.mousePosImageY = 15;

        await onDrawingToolDrag(mockOperation);

        expect(mockOperation).toHaveBeenCalled();
        const [tilesArray] = mockOperation.mock.calls[0];
        expect(tilesArray.length).toBeGreaterThan(0);
    });

    test('should not call operation if tilesArray is empty', async () => {
        // Position outside bounds
        mockMain.listeners.drawingStartX = -100;
        mockMain.listeners.drawingStartY = -100;
        mockMain.mousePosImageX = -200;
        mockMain.mousePosImageY = -200;

        await onDrawingToolDrag(mockOperation);

        expect(mockOperation).not.toHaveBeenCalled();
    });
});

describe('onDrawingToolUp', () => {
    let mockMain;

    beforeEach(() => {
        mockMain = createMockMain();
        global.Main = mockMain;
    });

    test('should reset dragging flag', () => {
        mockMain.listeners.dragging = true;
        onDrawingToolUp({});
        expect(mockMain.listeners.dragging).toBe(false);
    });

    test('should work when dragging was already false', () => {
        mockMain.listeners.dragging = false;
        expect(() => onDrawingToolUp({})).not.toThrow();
        expect(mockMain.listeners.dragging).toBe(false);
    });
});

// Performance tests
describe('Performance', () => {
    let mockMain, mockStore, mockOperation;

    beforeEach(() => {
        mockMain = createMockMain();
        mockStore = createMockStore();
        mockOperation = vi.fn().mockResolvedValue();

        global.Main = mockMain;
        global.store = mockStore;
    });

    test('should handle large brush efficiently', async () => {
        mockMain.state.optionbar.size = [100, 100];

        const start = Date.now();
        await onDrawingToolClick(mockOperation);
        const end = Date.now();

        expect(end - start).toBeLessThan(100); // Should complete quickly
        expect(mockOperation).toHaveBeenCalled();
    });

    test('should handle long drag efficiently', async () => {
        mockMain.listeners.drawingStartX = 0;
        mockMain.listeners.drawingStartY = 0;
        mockMain.mousePosImageX = 50;
        mockMain.mousePosImageY = 50;

        const start = Date.now();
        await onDrawingToolDrag(mockOperation);
        const end = Date.now();

        expect(end - start).toBeLessThan(200); // Should complete quickly
        expect(mockOperation).toHaveBeenCalled();
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getBrushTiles,
        getFilteredTiles,
        onDrawingToolClick,
        onDrawingToolDrag,
        onDrawingToolUp
    };
}
