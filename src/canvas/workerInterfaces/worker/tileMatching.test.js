/**
 * Unit tests for tile matching logic (isTileSame function)
 * Tests the flood fill matching algorithms for tiles, walls, and liquids
 */

// Vitest provides globals automatically (describe, test, expect)
// No imports needed!

// Mock LAYERS enum
const LAYERS = {
    TILES: 0,
    WALLS: 1,
    WIRES: 2,
    LIQUIDS: 3
};

/**
 * Tile matching logic extracted from worker/editTiles.js
 * This is the core algorithm that determines which tiles to flood fill
 */
function isTileSame(tile1, tile2, layer) {
    const eq = (a, b) => (a === undefined && b === undefined) || a === b;

    switch (layer) {
        case LAYERS.TILES:
            // Match TileID and paint color, but NOT slope (fills through half-blocks/slopes)
            if (!eq(tile1.blockId, tile2.blockId)) return false;
            if (!eq(tile1.blockColor, tile2.blockColor)) return false;
            return true;

        case LAYERS.WALLS:
            if (!eq(tile1.wallId, tile2.wallId)) return false;
            if (!eq(tile1.wallColor, tile2.wallColor)) return false;
            return true;

        case LAYERS.WIRES:
            if (!eq(tile1.wireRed, tile2.wireRed)) return false;
            if (!eq(tile1.wireGreen, tile2.wireGreen)) return false;
            if (!eq(tile1.wireBlue, tile2.wireBlue)) return false;
            if (!eq(tile1.wireYellow, tile2.wireYellow)) return false;
            if (!eq(tile1.actuator, tile2.actuator)) return false;
            if (!eq(tile1.actuated, tile2.actuated)) return false;
            return true;

        case LAYERS.LIQUIDS:
            // Don't fill through solid blocks
            if (tile1.blockId !== undefined || tile2.blockId !== undefined) {
                return false;
            }
            const hasLiquid1 = (tile1.liquidAmount || 0) > 0;
            const hasLiquid2 = (tile2.liquidAmount || 0) > 0;
            if (hasLiquid1 !== hasLiquid2) return false;
            if (hasLiquid1 && !eq(tile1.liquidType, tile2.liquidType)) return false;
            return true;

        default:
            return false;
    }
}

describe('Tile Matching Logic', () => {
    describe('TILES layer matching', () => {
        test('should match same blockId with no paint', () => {
            const tile1 = { blockId: 1 };
            const tile2 = { blockId: 1 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });

        test('should match same blockId and paint color', () => {
            const tile1 = { blockId: 1, blockColor: 13 };
            const tile2 = { blockId: 1, blockColor: 13 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });

        test('should NOT match different blockId', () => {
            const tile1 = { blockId: 1 };
            const tile2 = { blockId: 2 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(false);
        });

        test('should NOT match different paint colors', () => {
            const tile1 = { blockId: 1, blockColor: 13 };
            const tile2 = { blockId: 1, blockColor: 14 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(false);
        });

        test('should match same tile with different slopes (USER REQUIREMENT)', () => {
            const tile1 = { blockId: 1, slope: 0 };  // Flat
            const tile2 = { blockId: 1, slope: 1 };  // Half-block
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });

        test('should match painted tile vs unpainted if same ID (EDGE CASE)', () => {
            const tile1 = { blockId: 1 };  // No paint
            const tile2 = { blockId: 1, blockColor: undefined };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });

        test('should NOT match painted vs unpainted different color', () => {
            const tile1 = { blockId: 1, blockColor: 0 };  // No paint (0)
            const tile2 = { blockId: 1, blockColor: 13 }; // Red paint
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(false);
        });

        test('should handle undefined blockId in both tiles', () => {
            const tile1 = {};
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });

        test('should NOT match when one has blockId and other does not', () => {
            const tile1 = { blockId: 1 };
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(false);
        });
    });

    describe('WALLS layer matching', () => {
        test('should match same wallId with no paint', () => {
            const tile1 = { wallId: 1 };
            const tile2 = { wallId: 1 };
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(true);
        });

        test('should match same wallId and paint color', () => {
            const tile1 = { wallId: 4, wallColor: 13 };
            const tile2 = { wallId: 4, wallColor: 13 };
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(true);
        });

        test('should NOT match different wallId', () => {
            const tile1 = { wallId: 1 };
            const tile2 = { wallId: 2 };
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(false);
        });

        test('should NOT match different wall paint colors', () => {
            const tile1 = { wallId: 4, wallColor: 13 };
            const tile2 = { wallId: 4, wallColor: 14 };
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(false);
        });

        test('should handle undefined wallId in both tiles', () => {
            const tile1 = {};
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(true);
        });

        test('should NOT match when one has wallId and other does not', () => {
            const tile1 = { wallId: 1 };
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(false);
        });
    });

    describe('WIRES layer matching', () => {
        test('should match when no wires present', () => {
            const tile1 = {};
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(true);
        });

        test('should match same wire configuration', () => {
            const tile1 = { wireRed: true, wireBlue: true };
            const tile2 = { wireRed: true, wireBlue: true };
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(true);
        });

        test('should NOT match different red wire', () => {
            const tile1 = { wireRed: true };
            const tile2 = { wireRed: false };
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(false);
        });

        test('should NOT match different green wire', () => {
            const tile1 = { wireGreen: true };
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(false);
        });

        test('should match with actuator', () => {
            const tile1 = { actuator: true, actuated: false };
            const tile2 = { actuator: true, actuated: false };
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(true);
        });

        test('should NOT match different actuator state', () => {
            const tile1 = { actuator: true };
            const tile2 = { actuator: false };
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(false);
        });

        test('should match all wire colors', () => {
            const tile1 = {
                wireRed: true,
                wireGreen: true,
                wireBlue: true,
                wireYellow: true
            };
            const tile2 = {
                wireRed: true,
                wireGreen: true,
                wireBlue: true,
                wireYellow: true
            };
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(true);
        });
    });

    describe('LIQUIDS layer matching', () => {
        test('should match same liquid type', () => {
            const tile1 = { liquidType: 0, liquidAmount: 255 };  // Water
            const tile2 = { liquidType: 0, liquidAmount: 200 };  // Water (different amount)
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });

        test('should NOT match different liquid types', () => {
            const tile1 = { liquidType: 0, liquidAmount: 255 };  // Water
            const tile2 = { liquidType: 1, liquidAmount: 255 };  // Lava
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(false);
        });

        test('should match empty liquid spaces (air)', () => {
            const tile1 = { liquidAmount: 0 };
            const tile2 = { liquidAmount: 0 };
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });

        test('should NOT match liquid vs empty', () => {
            const tile1 = { liquidType: 0, liquidAmount: 255 };
            const tile2 = { liquidAmount: 0 };
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(false);
        });

        test('should NOT fill through solid blocks', () => {
            const tile1 = { blockId: 1, liquidType: 0, liquidAmount: 255 };  // Water in solid block
            const tile2 = { liquidType: 0, liquidAmount: 255 };              // Water in air
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(false);
        });

        test('should NOT match if one tile has solid block', () => {
            const tile1 = { liquidType: 0, liquidAmount: 255 };  // Water
            const tile2 = { blockId: 1 };                        // Solid block
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(false);
        });

        test('should handle undefined liquidAmount as zero', () => {
            const tile1 = {};
            const tile2 = { liquidAmount: 0 };
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });

        test('should match water with different amounts (USER REQUIREMENT)', () => {
            const tile1 = { liquidType: 0, liquidAmount: 10 };
            const tile2 = { liquidType: 0, liquidAmount: 255 };
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });

        test('should match lava with different amounts', () => {
            const tile1 = { liquidType: 1, liquidAmount: 50 };
            const tile2 = { liquidType: 1, liquidAmount: 100 };
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });

        test('should match honey with different amounts', () => {
            const tile1 = { liquidType: 2, liquidAmount: 150 };
            const tile2 = { liquidType: 2, liquidAmount: 200 };
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });
    });

    describe('Edge cases', () => {
        test('should return false for unknown layer', () => {
            const tile1 = { blockId: 1 };
            const tile2 = { blockId: 1 };
            expect(isTileSame(tile1, tile2, 999)).toBe(false);
        });

        test('should handle empty tiles (no properties)', () => {
            const tile1 = {};
            const tile2 = {};
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(true);
            expect(isTileSame(tile1, tile2, LAYERS.WIRES)).toBe(true);
            expect(isTileSame(tile1, tile2, LAYERS.LIQUIDS)).toBe(true);
        });

        test('should handle null/undefined tile properties gracefully', () => {
            const tile1 = { blockId: undefined, blockColor: null };
            const tile2 = { blockId: undefined, blockColor: null };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });

        test('should handle complex tile with multiple properties', () => {
            const tile1 = {
                blockId: 1,
                blockColor: 13,
                slope: 2,
                wallId: 4,
                wallColor: 5,
                liquidType: 0,
                liquidAmount: 255
            };
            const tile2 = {
                blockId: 1,
                blockColor: 13,
                slope: 3,  // Different slope
                wallId: 4,
                wallColor: 5,
                liquidType: 0,
                liquidAmount: 200
            };
            // Should match for TILES (ignores slope)
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });
    });

    describe('Real-world scenarios', () => {
        test('Scenario: Fill dirt with different slopes and half-blocks', () => {
            const flatDirt = { blockId: 2, slope: 0 };
            const halfBlock = { blockId: 2, slope: 5 };
            const slopedDirt = { blockId: 2, slope: 1 };

            expect(isTileSame(flatDirt, halfBlock, LAYERS.TILES)).toBe(true);
            expect(isTileSame(flatDirt, slopedDirt, LAYERS.TILES)).toBe(true);
            expect(isTileSame(halfBlock, slopedDirt, LAYERS.TILES)).toBe(true);
        });

        test('Scenario: Fill stone with red paint vs unpainted', () => {
            const unpaintedStone = { blockId: 1, blockColor: 0 };
            const redStone = { blockId: 1, blockColor: 13 };

            expect(isTileSame(unpaintedStone, redStone, LAYERS.TILES)).toBe(false);
        });

        test('Scenario: Fill water through air pockets', () => {
            const water1 = { liquidType: 0, liquidAmount: 255 };
            const water2 = { liquidType: 0, liquidAmount: 100 };
            const air = { liquidAmount: 0 };

            expect(isTileSame(water1, water2, LAYERS.LIQUIDS)).toBe(true);
            expect(isTileSame(water1, air, LAYERS.LIQUIDS)).toBe(false);
        });

        test('Scenario: Fill stone wall with blue paint', () => {
            const unpaintedWall = { wallId: 1 };
            const blueWall = { wallId: 1, wallColor: 11 };

            expect(isTileSame(unpaintedWall, blueWall, LAYERS.WALLS)).toBe(false);
        });

        test('Scenario: Fill red wire network', () => {
            const redWire1 = { wireRed: true };
            const redWire2 = { wireRed: true };
            const noWire = {};

            expect(isTileSame(redWire1, redWire2, LAYERS.WIRES)).toBe(true);
            expect(isTileSame(redWire1, noWire, LAYERS.WIRES)).toBe(false);
        });
    });
});
