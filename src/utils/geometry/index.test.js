/**
 * Unit tests for geometry utilities
 */

import {
    drawLine,
    fillRectangleCentered,
    fillEllipseCentered,
    deduplicateTiles
} from './index.js';

describe('Geometry Utilities', () => {
    describe('drawLine', () => {
        test('should handle null/undefined inputs', () => {
            expect(drawLine(null, {x: 5, y: 5})).toEqual([]);
            expect(drawLine({x: 5, y: 5}, null)).toEqual([]);
            expect(drawLine(undefined, {x: 5, y: 5})).toEqual([]);
        });

        test('should return single point when start equals end', () => {
            const result = drawLine({x: 5, y: 5}, {x: 5, y: 5});
            expect(result).toEqual([{x: 5, y: 5}]);
        });

        test('should draw horizontal line (left to right)', () => {
            const result = drawLine({x: 0, y: 0}, {x: 5, y: 0});
            expect(result.length).toBe(6); // 0,1,2,3,4,5
            expect(result[0]).toEqual({x: 0, y: 0});
            expect(result[5]).toEqual({x: 5, y: 0});
            // All points should be on y=0
            result.forEach(p => expect(p.y).toBe(0));
        });

        test('should draw horizontal line (right to left)', () => {
            const result = drawLine({x: 5, y: 0}, {x: 0, y: 0});
            expect(result.length).toBe(6);
            expect(result[0]).toEqual({x: 5, y: 0});
            expect(result[5]).toEqual({x: 0, y: 0});
        });

        test('should draw vertical line (top to bottom)', () => {
            const result = drawLine({x: 0, y: 0}, {x: 0, y: 5});
            expect(result.length).toBe(6);
            expect(result[0]).toEqual({x: 0, y: 0});
            expect(result[5]).toEqual({x: 0, y: 5});
            result.forEach(p => expect(p.x).toBe(0));
        });

        test('should draw vertical line (bottom to top)', () => {
            const result = drawLine({x: 0, y: 5}, {x: 0, y: 0});
            expect(result.length).toBe(6);
            expect(result[0]).toEqual({x: 0, y: 5});
            expect(result[5]).toEqual({x: 0, y: 0});
        });

        test('should draw diagonal line (45 degrees)', () => {
            const result = drawLine({x: 0, y: 0}, {x: 5, y: 5});
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toEqual({x: 0, y: 0});
            expect(result[result.length - 1]).toEqual({x: 5, y: 5});
        });

        test('should handle undefined x/y in start/end objects', () => {
            const result = drawLine({y: 5}, {x: 5, y: 5});
            expect(result.length).toBeGreaterThan(0);
            // Should default to 0 for undefined x
        });
    });

    describe('fillRectangleCentered', () => {
        test('should return empty array for undefined center/size', () => {
            expect(fillRectangleCentered(null, {x: 5, y: 5})).toEqual([]);
            expect(fillRectangleCentered({x: 5, y: 5}, null)).toEqual([]);
        });

        test('should fill 3x3 rectangle centered at origin', () => {
            const result = fillRectangleCentered({x: 0, y: 0}, {x: 3, y: 3});
            expect(result.length).toBe(9); // 3x3 = 9 tiles
        });

        test('should fill 1x1 rectangle', () => {
            const result = fillRectangleCentered({x: 5, y: 5}, {x: 1, y: 1});
            expect(result.length).toBe(1);
            expect(result[0]).toEqual({x: 5, y: 5});
        });

        test('should fill 5x5 rectangle centered at (10,10)', () => {
            const result = fillRectangleCentered({x: 10, y: 10}, {x: 5, y: 5});
            expect(result.length).toBe(25); // 5x5 = 25 tiles
            // Check bounds
            const minX = Math.min(...result.map(p => p.x));
            const maxX = Math.max(...result.map(p => p.x));
            const minY = Math.min(...result.map(p => p.y));
            const maxY = Math.max(...result.map(p => p.y));

            expect(maxX - minX + 1).toBe(5);
            expect(maxY - minY + 1).toBe(5);
        });
    });

    describe('fillEllipseCentered', () => {
        test('should return empty array for invalid inputs', () => {
            expect(fillEllipseCentered(null, {x: 5, y: 5})).toEqual([]);
            expect(fillEllipseCentered({x: 5, y: 5}, null)).toEqual([]);
        });

        test('should return single point for radius < 1', () => {
            const result = fillEllipseCentered({x: 5, y: 5}, {x: 0, y: 0});
            expect(result).toEqual([{x: 5, y: 5}]);
        });

        test('should fill circle at origin', () => {
            const result = fillEllipseCentered({x: 0, y: 0}, {x: 3, y: 3});
            expect(result.length).toBeGreaterThan(0);
            // Center should be included somewhere in the result
            expect(result.some(p => p.x === 0 && p.y === 0)).toBe(true);
        });

        test('should fill ellipse with different radii', () => {
            const result = fillEllipseCentered({x: 10, y: 10}, {x: 5, y: 3});
            expect(result.length).toBeGreaterThan(0);

            // Check that all points are within expected bounds
            result.forEach(p => {
                const dx = Math.abs(p.x - 10);
                const dy = Math.abs(p.y - 10);
                // Rough check - not exact ellipse equation
                expect(dx).toBeLessThanOrEqual(5);
                expect(dy).toBeLessThanOrEqual(3);
            });
        });
    });

    describe('deduplicateTiles', () => {
        test('should remove duplicate tiles', () => {
            const tiles = [[1, 1], [2, 2], [1, 1], [3, 3], [2, 2]];
            const result = deduplicateTiles(tiles);
            expect(result.length).toBe(3);
            expect(result).toContainEqual([1, 1]);
            expect(result).toContainEqual([2, 2]);
            expect(result).toContainEqual([3, 3]);
        });

        test('should preserve order of first occurrence', () => {
            const tiles = [[1, 1], [2, 2], [1, 1]];
            const result = deduplicateTiles(tiles);
            expect(result[0]).toEqual([1, 1]);
            expect(result[1]).toEqual([2, 2]);
        });

        test('should handle empty array', () => {
            const result = deduplicateTiles([]);
            expect(result).toEqual([]);
        });

        test('should distinguish between (1,2) and (2,1)', () => {
            const tiles = [[1, 2], [2, 1], [1, 2]];
            const result = deduplicateTiles(tiles);
            expect(result.length).toBe(2);
            expect(result).toContainEqual([1, 2]);
            expect(result).toContainEqual([2, 1]);
        });

        test('should handle large arrays efficiently', () => {
            const tiles = [];
            // Create 1000 tiles with duplicates (only 100 unique positions)
            for (let i = 0; i < 1000; i++) {
                tiles.push([i % 10, Math.floor(i / 100)]);
            }
            const startTime = Date.now();
            const result = deduplicateTiles(tiles);
            const endTime = Date.now();

            // Should deduplicate to 100 unique tiles (10 x values * 10 y values)
            expect(result.length).toBe(100);
            expect(result.length).toBeLessThan(tiles.length);
            expect(endTime - startTime).toBeLessThan(100); // Should be fast
        });
    });
});

// Export for testing in Node environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        drawLine,
        fillRectangleCentered,
        fillEllipseCentered,
        deduplicateTiles
    };
}
