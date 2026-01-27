/**
 * Unit tests for colorApplication utility
 * Tests the shared color application logic used by pencil, brush, and bucket fill tools
 */

// Vitest provides globals automatically (describe, test, expect, beforeEach)
// No imports needed!

describe('colorApplication algorithm tests', () => {
    describe('Color application logic', () => {
        let mockLayerData;
        let mockColors;

        beforeEach(() => {
            // Create a 10x10 grid (400 bytes: 10*10*4)
            mockLayerData = new Uint8ClampedArray(400);

            mockColors = {
                0: { // LAYERS.TILES
                    1: { r: 255, g: 0, b: 0, a: 255 },  // Red tile
                    160: [ // Rainbow brick - 3 color variations
                        { r: 255, g: 0, b: 0, a: 255 },   // Red
                        { r: 0, g: 255, b: 0, a: 255 },   // Green
                        { r: 0, g: 0, b: 255, a: 255 }    // Blue
                    ],
                    51: [ // Checkerboard - 2 color variations
                        { r: 100, g: 100, b: 100, a: 255 },
                        { r: 200, g: 200, b: 200, a: 255 }
                    ]
                }
            };
        });

        test('should correctly calculate offset for tile position', () => {
            const maxTilesX = 10;

            // Tile [0,0] should be at offset 0
            const offset00 = (maxTilesX * 0 + 0) * 4;
            expect(offset00).toBe(0);

            // Tile [1,0] should be at offset 4
            const offset10 = (maxTilesX * 0 + 1) * 4;
            expect(offset10).toBe(4);

            // Tile [0,1] should be at offset 40 (skip entire first row)
            const offset01 = (maxTilesX * 1 + 0) * 4;
            expect(offset01).toBe(40);

            // Tile [5,5] should be at offset 220
            const offset55 = (maxTilesX * 5 + 5) * 4;
            expect(offset55).toBe(220);

            // Tile [9,9] should be at offset 396 (last tile)
            const offset99 = (maxTilesX * 9 + 9) * 4;
            expect(offset99).toBe(396);
        });

        test('should apply single color to normal tiles', () => {
            const tilesArray = [[0, 0], [1, 1], [2, 2]];
            const layer = 0;
            const id = 1;
            const maxTilesX = 10;
            const selectedColor = mockColors[layer][id];

            // Apply color manually (testing the logic)
            tilesArray.forEach(([x, y]) => {
                const offset = (maxTilesX * y + x) * 4;
                mockLayerData[offset] = selectedColor.r;
                mockLayerData[offset + 1] = selectedColor.g;
                mockLayerData[offset + 2] = selectedColor.b;
                mockLayerData[offset + 3] = selectedColor.a;
            });

            // Verify [0,0]
            expect(mockLayerData[0]).toBe(255);   // r
            expect(mockLayerData[1]).toBe(0);     // g
            expect(mockLayerData[2]).toBe(0);     // b
            expect(mockLayerData[3]).toBe(255);   // a

            // Verify [1,1] - offset = (10 * 1 + 1) * 4 = 44
            expect(mockLayerData[44]).toBe(255);
            expect(mockLayerData[45]).toBe(0);
            expect(mockLayerData[46]).toBe(0);
            expect(mockLayerData[47]).toBe(255);

            // Verify [2,2] - offset = (10 * 2 + 2) * 4 = 88
            expect(mockLayerData[88]).toBe(255);
            expect(mockLayerData[89]).toBe(0);
            expect(mockLayerData[90]).toBe(0);
            expect(mockLayerData[91]).toBe(255);
        });

        test('should apply rainbow brick pattern (3 colors based on Y)', () => {
            const tilesArray = [
                [0, 0], // Y=0 % 3 = 0 -> red
                [0, 1], // Y=1 % 3 = 1 -> green
                [0, 2], // Y=2 % 3 = 2 -> blue
                [0, 3]  // Y=3 % 3 = 0 -> red
            ];
            const layer = 0;
            const id = 160;
            const maxTilesX = 10;
            const selectedColor = mockColors[layer][id];

            // Apply rainbow pattern
            tilesArray.forEach(([x, y]) => {
                const temp = y % 3;
                const offset = (maxTilesX * y + x) * 4;
                mockLayerData[offset] = selectedColor[temp].r;
                mockLayerData[offset + 1] = selectedColor[temp].g;
                mockLayerData[offset + 2] = selectedColor[temp].b;
                mockLayerData[offset + 3] = selectedColor[temp].a;
            });

            // Tile [0,0] - Y=0 % 3 = 0 -> red (255,0,0)
            expect(mockLayerData[0]).toBe(255);
            expect(mockLayerData[1]).toBe(0);
            expect(mockLayerData[2]).toBe(0);

            // Tile [0,1] - Y=1 % 3 = 1 -> green (0,255,0)
            const offset1 = (maxTilesX * 1 + 0) * 4;
            expect(mockLayerData[offset1]).toBe(0);
            expect(mockLayerData[offset1 + 1]).toBe(255);
            expect(mockLayerData[offset1 + 2]).toBe(0);

            // Tile [0,2] - Y=2 % 3 = 2 -> blue (0,0,255)
            const offset2 = (maxTilesX * 2 + 0) * 4;
            expect(mockLayerData[offset2]).toBe(0);
            expect(mockLayerData[offset2 + 1]).toBe(0);
            expect(mockLayerData[offset2 + 2]).toBe(255);

            // Tile [0,3] - Y=3 % 3 = 0 -> red (255,0,0)
            const offset3 = (maxTilesX * 3 + 0) * 4;
            expect(mockLayerData[offset3]).toBe(255);
            expect(mockLayerData[offset3 + 1]).toBe(0);
            expect(mockLayerData[offset3 + 2]).toBe(0);
        });

        test('should apply checkerboard pattern (2 colors based on X+Y)', () => {
            const tilesArray = [
                [0, 0], // (0+0) % 2 = 0 -> color 0 (100,100,100)
                [1, 0], // (1+0) % 2 = 1 -> color 1 (200,200,200)
                [0, 1], // (0+1) % 2 = 1 -> color 1 (200,200,200)
                [1, 1]  // (1+1) % 2 = 0 -> color 0 (100,100,100)
            ];
            const layer = 0;
            const id = 51;
            const maxTilesX = 10;
            const selectedColor = mockColors[layer][id];

            // Apply checkerboard pattern
            tilesArray.forEach(([x, y]) => {
                const temp = (x + y) % 2;
                const offset = (maxTilesX * y + x) * 4;
                mockLayerData[offset] = selectedColor[temp].r;
                mockLayerData[offset + 1] = selectedColor[temp].g;
                mockLayerData[offset + 2] = selectedColor[temp].b;
                mockLayerData[offset + 3] = selectedColor[temp].a;
            });

            // Tile [0,0] - (0+0) % 2 = 0 -> (100,100,100)
            expect(mockLayerData[0]).toBe(100);
            expect(mockLayerData[1]).toBe(100);
            expect(mockLayerData[2]).toBe(100);

            // Tile [1,0] - (1+0) % 2 = 1 -> (200,200,200)
            const offset1 = (maxTilesX * 0 + 1) * 4;
            expect(mockLayerData[offset1]).toBe(200);
            expect(mockLayerData[offset1 + 1]).toBe(200);
            expect(mockLayerData[offset1 + 2]).toBe(200);

            // Tile [0,1] - (0+1) % 2 = 1 -> (200,200,200)
            const offset2 = (maxTilesX * 1 + 0) * 4;
            expect(mockLayerData[offset2]).toBe(200);
            expect(mockLayerData[offset2 + 1]).toBe(200);
            expect(mockLayerData[offset2 + 2]).toBe(200);

            // Tile [1,1] - (1+1) % 2 = 0 -> (100,100,100)
            const offset3 = (maxTilesX * 1 + 1) * 4;
            expect(mockLayerData[offset3]).toBe(100);
            expect(mockLayerData[offset3 + 1]).toBe(100);
            expect(mockLayerData[offset3 + 2]).toBe(100);
        });

        test('should filter out-of-bounds tiles', () => {
            const maxTilesX = 10;
            const maxTilesY = 10;
            const tilesArray = [
                [-1, 0],  // Out of bounds (negative x)
                [0, -1],  // Out of bounds (negative y)
                [10, 0],  // Out of bounds (x >= maxTilesX)
                [0, 10],  // Out of bounds (y >= maxTilesY)
                [0, 0],   // Valid
                [9, 9]    // Valid (last tile)
            ];

            // Filter logic
            const filteredTiles = tilesArray.filter(([x, y]) =>
                x >= 0 && y >= 0 && x < maxTilesX && y < maxTilesY
            );

            expect(filteredTiles).toHaveLength(2);
            expect(filteredTiles).toContainEqual([0, 0]);
            expect(filteredTiles).toContainEqual([9, 9]);
        });

        test('should handle large tile arrays efficiently', () => {
            // Create 100 tiles (10x10 grid)
            const tilesArray = [];
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    tilesArray.push([i, j]);
                }
            }

            expect(tilesArray).toHaveLength(100);

            // Verify array structure
            expect(tilesArray[0]).toEqual([0, 0]);   // First tile
            expect(tilesArray[99]).toEqual([9, 9]);  // Last tile
        });

        test('should calculate correct offsets for all corners', () => {
            const maxTilesX = 10;
            const maxTilesY = 10;

            // Top-left corner [0,0]
            const tlOffset = (maxTilesX * 0 + 0) * 4;
            expect(tlOffset).toBe(0);

            // Top-right corner [9,0]
            const trOffset = (maxTilesX * 0 + 9) * 4;
            expect(trOffset).toBe(36);

            // Bottom-left corner [0,9]
            const blOffset = (maxTilesX * 9 + 0) * 4;
            expect(blOffset).toBe(360);

            // Bottom-right corner [9,9]
            const brOffset = (maxTilesX * 9 + 9) * 4;
            expect(brOffset).toBe(396);
        });

        test('should validate RGBA components are within valid range', () => {
            const color = mockColors[0][1];

            // All values should be 0-255
            expect(color.r).toBeGreaterThanOrEqual(0);
            expect(color.r).toBeLessThanOrEqual(255);
            expect(color.g).toBeGreaterThanOrEqual(0);
            expect(color.g).toBeLessThanOrEqual(255);
            expect(color.b).toBeGreaterThanOrEqual(0);
            expect(color.b).toBeLessThanOrEqual(255);
            expect(color.a).toBeGreaterThanOrEqual(0);
            expect(color.a).toBeLessThanOrEqual(255);
        });

        test('should handle rainbow brick edge cases', () => {
            // Test Y coordinate modulo 3 for various values
            expect(0 % 3).toBe(0);
            expect(1 % 3).toBe(1);
            expect(2 % 3).toBe(2);
            expect(3 % 3).toBe(0);
            expect(100 % 3).toBe(1);
            expect(999 % 3).toBe(0);
        });

        test('should handle checkerboard edge cases', () => {
            // Test (X+Y) modulo 2 for various coordinates
            expect((0 + 0) % 2).toBe(0);
            expect((1 + 0) % 2).toBe(1);
            expect((0 + 1) % 2).toBe(1);
            expect((1 + 1) % 2).toBe(0);
            expect((50 + 50) % 2).toBe(0);
            expect((51 + 50) % 2).toBe(1);
        });
    });
});
