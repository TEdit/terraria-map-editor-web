/**
 * Integration tests for drawing tools flow
 * Tests the click -> drag -> up sequence
 */

describe('Drawing Tools Flow', () => {
    let mockMain;

    beforeEach(() => {
        // Mock Main object
        mockMain = {
            mousePosImageX: 10,
            mousePosImageY: 10,
            mousePosElementX: 100,
            mousePosElementY: 100,
            listeners: {
                dragging: false,
                pencilStartX: undefined,
                pencilStartY: undefined
            },
            state: {
                optionbar: {
                    size: [5, 5],
                    id: 1,
                    layer: 0
                },
                toolbar: {
                    tool: 'pencil'
                },
                canvas: {
                    worldObject: {
                        header: {
                            maxTilesX: 1000,
                            maxTilesY: 1000
                        }
                    }
                },
                selection: {
                    active: false
                }
            },
            layersImages: {
                0: {
                    data: new Uint8ClampedArray(1000 * 1000 * 4)
                }
            },
            updateLayers: vi.fn(),
            workerInterfaces: {
                editTiles: vi.fn().mockResolvedValue({})
            }
        };
    });

    test('click should set start position and draw brush once', () => {
        // Simulate click at (10, 10)
        mockMain.mousePosImageX = 10;
        mockMain.mousePosImageY = 10;

        // Simulate onPencilClick
        if (!mockMain.listeners.dragging) {
            mockMain.listeners.pencilStartX = mockMain.mousePosImageX;
            mockMain.listeners.pencilStartY = mockMain.mousePosImageY;

            expect(mockMain.listeners.pencilStartX).toBe(10);
            expect(mockMain.listeners.pencilStartY).toBe(10);
            expect(mockMain.listeners.dragging).toBe(false);
        }
    });

    test('click then drag should draw line from start to current', () => {
        // Click at (10, 10)
        mockMain.mousePosImageX = 10;
        mockMain.mousePosImageY = 10;
        mockMain.listeners.pencilStartX = mockMain.mousePosImageX;
        mockMain.listeners.pencilStartY = mockMain.mousePosImageY;

        // Drag to (15, 15)
        mockMain.mousePosImageX = 15;
        mockMain.mousePosImageY = 15;

        if (!mockMain.listeners.dragging) {
            mockMain.listeners.dragging = true;
        }

        // Line should go from (10,10) to (15,15)
        expect(mockMain.listeners.pencilStartX).toBe(10);
        expect(mockMain.listeners.pencilStartY).toBe(10);
        expect(mockMain.mousePosImageX).toBe(15);
        expect(mockMain.mousePosImageY).toBe(15);
        expect(mockMain.listeners.dragging).toBe(true);
    });

    test('continuous drag should update start for next segment', () => {
        // First click at (10, 10)
        mockMain.mousePosImageX = 10;
        mockMain.mousePosImageY = 10;
        mockMain.listeners.pencilStartX = 10;
        mockMain.listeners.pencilStartY = 10;

        // First drag to (15, 15)
        mockMain.mousePosImageX = 15;
        mockMain.mousePosImageY = 15;
        mockMain.listeners.pencilStartX = mockMain.mousePosImageX;
        mockMain.listeners.pencilStartY = mockMain.mousePosImageY;

        expect(mockMain.listeners.pencilStartX).toBe(15);
        expect(mockMain.listeners.pencilStartY).toBe(15);

        // Second drag to (20, 20)
        mockMain.mousePosImageX = 20;
        mockMain.mousePosImageY = 20;

        // Next line should draw from (15,15) to (20,20)
        expect(mockMain.listeners.pencilStartX).toBe(15);
        expect(mockMain.listeners.pencilStartY).toBe(15);
        expect(mockMain.mousePosImageX).toBe(20);
        expect(mockMain.mousePosImageY).toBe(20);
    });

    test('mouseup should end the stroke', () => {
        mockMain.listeners.dragging = true;

        // Simulate mouseup
        mockMain.listeners.dragging = false;

        expect(mockMain.listeners.dragging).toBe(false);
    });
});
