/**
 * Integration tests for the pencil tool
 * Tests the complete click -> drag -> up workflow with the actual operation function
 */

import { onPencilClick, onPencilDrag, onPencilUp } from './pencil.js';

// Create comprehensive mock for Main object
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
            id: 1, // Dirt block
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

// Mock colors database
const createMockColors = () => ({
    0: { // Layer 0 (tiles)
        1: { r: 150, g: 75, b: 0, a: 255 },  // Dirt
        160: [  // Rainbow brick (3 variations)
            { r: 255, g: 0, b: 0, a: 255 },
            { r: 0, g: 255, b: 0, a: 255 },
            { r: 0, g: 0, b: 255, a: 255 }
        ],
        51: [  // Checkerboard (2 variations)
            { r: 200, g: 200, b: 200, a: 255 },
            { r: 100, g: 100, b: 100, a: 255 }
        ]
    }
});

describe('Pencil Tool Integration Tests', () => {
    let mockMain, mockStore, mockColors;

    beforeEach(() => {
        mockMain = createMockMain();
        mockStore = createMockStore();
        mockColors = createMockColors();

        global.Main = mockMain;
        global.store = mockStore;
        global.colors = mockColors;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Click Functionality', () => {
        test('should paint tiles on single click', async () => {
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            expect(mockMain.updateLayers).toHaveBeenCalledWith(0);
            expect(mockMain.workerInterfaces.editTiles).toHaveBeenCalled();

            // Check that some pixels were painted
            const data = mockMain.layersImages[0].data;
            let paintedPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 0) paintedPixels++;
            }
            expect(paintedPixels).toBeGreaterThan(0);
        });

        test('should set initial drawing position', async () => {
            mockMain.mousePosImageX = 15;
            mockMain.mousePosImageY = 25;

            await onPencilClick({});

            expect(mockMain.listeners.drawingStartX).toBe(15);
            expect(mockMain.listeners.drawingStartY).toBe(25);
        });

        test('should paint correct color', async () => {
            mockMain.state.optionbar.id = 1; // Dirt
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            // Calculate pixel offset for position (10, 10)
            const offset = (100 * 10 + 10) * 4;
            const data = mockMain.layersImages[0].data;

            expect(data[offset]).toBe(150);     // R
            expect(data[offset + 1]).toBe(75);  // G
            expect(data[offset + 2]).toBe(0);   // B
            expect(data[offset + 3]).toBe(255); // A
        });

        test('should handle 1x1 brush', async () => {
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = 5;
            mockMain.mousePosImageY = 5;

            await onPencilClick({});

            expect(mockMain.workerInterfaces.editTiles).toHaveBeenCalled();
            const call = mockMain.workerInterfaces.editTiles.mock.calls[0];
            const [options] = call;

            expect(options.layer).toBe(0);
            expect(options.editType).toBe('tileslist');
            expect(options.tileEditArgs).toBeDefined();
        });

        test('should handle large brush (50x50)', async () => {
            mockMain.state.optionbar.size = [50, 50];
            mockMain.mousePosImageX = 50;
            mockMain.mousePosImageY = 50;

            await onPencilClick({});

            expect(mockMain.updateLayers).toHaveBeenCalled();
            expect(mockMain.workerInterfaces.editTiles).toHaveBeenCalled();
        });
    });

    describe('Drag Functionality', () => {
        test('should paint continuous line on drag', async () => {
            // Click at (10, 10)
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;
            await onPencilClick({});

            vi.clearAllMocks();

            // Drag to (20, 20)
            mockMain.mousePosImageX = 20;
            mockMain.mousePosImageY = 20;
            await onPencilDrag({});

            expect(mockMain.listeners.dragging).toBe(true);
            expect(mockMain.updateLayers).toHaveBeenCalled();
            expect(mockMain.workerInterfaces.editTiles).toHaveBeenCalled();

            // Drawing start position should be updated
            expect(mockMain.listeners.drawingStartX).toBe(20);
            expect(mockMain.listeners.drawingStartY).toBe(20);
        });

        test('should interpolate line without gaps', async () => {
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = 0;
            mockMain.mousePosImageY = 0;
            mockMain.listeners.drawingStartX = 0;
            mockMain.listeners.drawingStartY = 0;

            // Make a long drag
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilDrag({});

            // Check that pixels form a continuous diagonal line
            const data = mockMain.layersImages[0].data;
            let paintedCount = 0;

            for (let i = 0; i <= 10; i++) {
                const offset = (100 * i + i) * 4; // Diagonal pixels
                if (data[offset + 3] > 0) {
                    paintedCount++;
                }
            }

            expect(paintedCount).toBeGreaterThan(5); // Should paint multiple pixels along line
        });

        test('should handle multiple drag segments', async () => {
            mockMain.state.optionbar.size = [1, 1];

            // First segment: (0,0) -> (5,5)
            mockMain.listeners.drawingStartX = 0;
            mockMain.listeners.drawingStartY = 0;
            mockMain.mousePosImageX = 5;
            mockMain.mousePosImageY = 5;
            await onPencilDrag({});

            vi.clearAllMocks();

            // Second segment: (5,5) -> (10,5)
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 5;
            await onPencilDrag({});

            expect(mockMain.updateLayers).toHaveBeenCalled();
            expect(mockMain.listeners.drawingStartX).toBe(10);
            expect(mockMain.listeners.drawingStartY).toBe(5);
        });

        test('should work with circle brush', async () => {
            mockMain.state.optionbar.brushShape = 'circle';
            mockMain.state.optionbar.size = [5, 5];
            mockMain.listeners.drawingStartX = 10;
            mockMain.listeners.drawingStartY = 10;
            mockMain.mousePosImageX = 15;
            mockMain.mousePosImageY = 15;

            await onPencilDrag({});

            expect(mockMain.updateLayers).toHaveBeenCalled();
        });
    });

    describe('Mouse Up', () => {
        test('should reset dragging flag on mouse up', () => {
            mockMain.listeners.dragging = true;
            onPencilUp({});
            expect(mockMain.listeners.dragging).toBe(false);
        });

        test('should allow new stroke after mouse up', async () => {
            // First stroke
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;
            await onPencilClick({});
            await onPencilDrag({});

            onPencilUp({});
            vi.clearAllMocks();

            // Second stroke should work
            mockMain.mousePosImageX = 20;
            mockMain.mousePosImageY = 20;
            await onPencilClick({});

            expect(mockMain.updateLayers).toHaveBeenCalled();
        });
    });

    describe('Special Tile IDs', () => {
        test('should handle rainbow brick (ID 160)', async () => {
            mockMain.state.optionbar.id = 160;
            mockMain.state.optionbar.size = [1, 3];
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            // Check that different rows get different colors
            const data = mockMain.layersImages[0].data;
            const colors = [];

            for (let y = 9; y <= 11; y++) {
                const offset = (100 * y + 10) * 4;
                colors.push({
                    r: data[offset],
                    g: data[offset + 1],
                    b: data[offset + 2]
                });
            }

            // Colors should vary based on Y coordinate
            const uniqueColors = new Set(colors.map(c => `${c.r},${c.g},${c.b}`));
            expect(uniqueColors.size).toBeGreaterThan(1);
        });

        test('should handle checkerboard (ID 51)', async () => {
            mockMain.state.optionbar.id = 51;
            mockMain.state.optionbar.size = [2, 2];
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            // Check checkerboard pattern
            const data = mockMain.layersImages[0].data;

            const getColor = (x, y) => {
                const offset = (100 * y + x) * 4;
                return data[offset];
            };

            // Checkerboard should alternate
            const c1 = getColor(9, 9);
            const c2 = getColor(10, 9);
            const c3 = getColor(9, 10);
            const c4 = getColor(10, 10);

            expect(c1).not.toBe(c2); // Adjacent pixels should differ
            expect(c1).toBe(c4);     // Diagonal pixels should match
            expect(c2).toBe(c3);     // Diagonal pixels should match
        });

        test('should handle regular tiles (non-special)', async () => {
            mockMain.state.optionbar.id = 1; // Regular dirt
            mockMain.state.optionbar.size = [3, 3];
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            // All pixels should have same color
            const data = mockMain.layersImages[0].data;
            const pixelColors = new Set();

            for (let y = 9; y <= 11; y++) {
                for (let x = 9; x <= 11; x++) {
                    const offset = (100 * y + x) * 4;
                    pixelColors.add(`${data[offset]},${data[offset+1]},${data[offset+2]}`);
                }
            }

            expect(pixelColors.size).toBe(1); // All same color
        });
    });

    describe('Selection Integration', () => {
        test('should respect selection bounds', async () => {
            mockMain.state.selection = {
                active: true,
                x1: 8, y1: 8,
                x2: 12, y2: 12
            };
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            // Pixel at (10,10) should be painted (inside selection)
            const offset1 = (100 * 10 + 10) * 4;
            expect(mockMain.layersImages[0].data[offset1 + 3]).toBeGreaterThan(0);
        });

        test('should not paint outside selection', async () => {
            mockMain.state.selection = {
                active: true,
                x1: 20, y1: 20,
                x2: 30, y2: 30
            };
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = 10;  // Outside selection
            mockMain.mousePosImageY = 10;

            await onPencilClick({});

            // Nothing should be painted
            expect(mockMain.workerInterfaces.editTiles).not.toHaveBeenCalled();
        });

        test('should paint everywhere when selection is inactive', async () => {
            mockMain.state.selection.active = false;
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = 5;
            mockMain.mousePosImageY = 5;

            await onPencilClick({});

            expect(mockMain.workerInterfaces.editTiles).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle drawing at map edges (0,0)', async () => {
            mockMain.state.optionbar.size = [5, 5];
            mockMain.mousePosImageX = 0;
            mockMain.mousePosImageY = 0;

            await expect(onPencilClick({})).resolves.not.toThrow();
            expect(mockMain.updateLayers).toHaveBeenCalled();
        });

        test('should handle drawing at map edges (maxX, maxY)', async () => {
            mockMain.state.optionbar.size = [5, 5];
            mockMain.mousePosImageX = 99;
            mockMain.mousePosImageY = 99;

            await expect(onPencilClick({})).resolves.not.toThrow();
            expect(mockMain.updateLayers).toHaveBeenCalled();
        });

        test('should handle drawing outside map bounds', async () => {
            mockMain.state.optionbar.size = [1, 1];
            mockMain.mousePosImageX = -10;
            mockMain.mousePosImageY = -10;

            await expect(onPencilClick({})).resolves.not.toThrow();
            // Should not crash, but nothing painted
            expect(mockMain.workerInterfaces.editTiles).not.toHaveBeenCalled();
        });

        test('should handle missing canvas data', async () => {
            mockMain.state.canvas = null;

            await expect(onPencilClick({})).resolves.not.toThrow();
            expect(mockMain.updateLayers).not.toHaveBeenCalled();
        });

        test('should handle missing layer image data', async () => {
            mockMain.layersImages[0] = null;

            await expect(onPencilClick({})).resolves.not.toThrow();
            expect(mockMain.workerInterfaces.editTiles).not.toHaveBeenCalled();
        });

        test('should handle undefined brush shape (defaults to square)', async () => {
            mockMain.state.optionbar.brushShape = undefined;
            mockMain.state.optionbar.size = [3, 3];
            mockMain.mousePosImageX = 10;
            mockMain.mousePosImageY = 10;

            await expect(onPencilClick({})).resolves.not.toThrow();
            expect(mockMain.updateLayers).toHaveBeenCalled();
        });
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        onPencilClick,
        onPencilDrag,
        onPencilUp
    };
}
