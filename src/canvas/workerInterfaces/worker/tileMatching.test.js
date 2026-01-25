/**
 * Unit tests for tile matching logic (isTileSame function)
 * Tests the flood fill matching algorithms for tiles, walls, and liquids
 */

// Vitest provides globals automatically (describe, test, expect)
// No imports needed!

// Mock LAYERS enum (matches LAYERS.js)
const LAYERS = {
    BACKGROUND: 0,
    WALLS: 1,
    WALLPAINT: 2,
    TILES: 3,
    TILEPAINT: 4,
    LIQUIDS: 5,
    WIRES: 6
};

/**
 * Tile matching logic extracted from worker/editTiles.js
 * This is the core algorithm that determines which tiles to flood fill
 */
function isTileSame(tile1, tile2, layer, options = {}) {
    const eq = (a, b) => (a === undefined && b === undefined) || a === b;

    switch (layer) {
        case LAYERS.TILES:
            // Always match by TileID (not slope - fills through half-blocks/slopes)
            if (!eq(tile1.blockId, tile2.blockId)) return false;
            // If editing paint, also require paint color to match
            if (options.editBlockColor && !eq(tile1.blockColor, tile2.blockColor)) return false;
            return true;

        case LAYERS.TILEPAINT:
            // Paint layer: match by blockId and paint color
            if (!eq(tile1.blockId, tile2.blockId)) return false;
            if (!eq(tile1.blockColor, tile2.blockColor)) return false;
            return true;

        case LAYERS.WALLS:
            // Always match by WallID
            if (!eq(tile1.wallId, tile2.wallId)) return false;
            // If editing paint, also require paint color to match
            if (options.editWallColor && !eq(tile1.wallColor, tile2.wallColor)) return false;
            return true;

        case LAYERS.WALLPAINT:
            // Paint layer: match by wallId and paint color
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

        test('should match different paint colors (default: no paint edit)', () => {
            const tile1 = { blockId: 1, blockColor: 13 };
            const tile2 = { blockId: 1, blockColor: 14 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
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

        test('should match painted vs unpainted (default: no paint edit)', () => {
            const tile1 = { blockId: 1, blockColor: 0 };  // No paint (0)
            const tile2 = { blockId: 1, blockColor: 13 }; // Red paint
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
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

        test('should match different wall paint colors (default: no paint edit)', () => {
            const tile1 = { wallId: 4, wallColor: 13 };
            const tile2 = { wallId: 4, wallColor: 14 };
            expect(isTileSame(tile1, tile2, LAYERS.WALLS)).toBe(true);
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

        test('Scenario: Fill stone with red paint vs unpainted (no paint edit)', () => {
            const unpaintedStone = { blockId: 1, blockColor: 0 };
            const redStone = { blockId: 1, blockColor: 13 };

            // Default (no options) matches by ID only
            expect(isTileSame(unpaintedStone, redStone, LAYERS.TILES)).toBe(true);
        });

        test('Scenario: Fill water through air pockets', () => {
            const water1 = { liquidType: 0, liquidAmount: 255 };
            const water2 = { liquidType: 0, liquidAmount: 100 };
            const air = { liquidAmount: 0 };

            expect(isTileSame(water1, water2, LAYERS.LIQUIDS)).toBe(true);
            expect(isTileSame(water1, air, LAYERS.LIQUIDS)).toBe(false);
        });

        test('Scenario: Fill stone wall with blue paint (no paint edit)', () => {
            const unpaintedWall = { wallId: 1 };
            const blueWall = { wallId: 1, wallColor: 11 };

            // Default (no options) matches by ID only
            expect(isTileSame(unpaintedWall, blueWall, LAYERS.WALLS)).toBe(true);
        });

        test('Scenario: Fill red wire network', () => {
            const redWire1 = { wireRed: true };
            const redWire2 = { wireRed: true };
            const noWire = {};

            expect(isTileSame(redWire1, redWire2, LAYERS.WIRES)).toBe(true);
            expect(isTileSame(redWire1, noWire, LAYERS.WIRES)).toBe(false);
        });
    });

    describe('Paint operations (editBlockColor/editWallColor)', () => {
        test('should NOT match different paint colors when editBlockColor=true (painting requires same paint)', () => {
            const unpaintedStone = { blockId: 1 };
            const redStone = { blockId: 1, blockColor: 13 };
            const options = { editBlockColor: true };
            expect(isTileSame(unpaintedStone, redStone, LAYERS.TILES, options)).toBe(false);
        });

        test('should match different paint colors when editBlockColor=false (tile-only mode ignores paint)', () => {
            const unpaintedStone = { blockId: 1, blockColor: 0 };
            const redStone = { blockId: 1, blockColor: 13 };
            const options = { editBlockColor: false };
            expect(isTileSame(unpaintedStone, redStone, LAYERS.TILES, options)).toBe(true);
        });

        test('should match same paint when editBlockColor=true', () => {
            const redStone1 = { blockId: 1, blockColor: 13 };
            const redStone2 = { blockId: 1, blockColor: 13 };
            const options = { editBlockColor: true };
            expect(isTileSame(redStone1, redStone2, LAYERS.TILES, options)).toBe(true);
        });

        test('should NOT match different blockId even when editBlockColor=true', () => {
            const stone = { blockId: 1, blockColor: 0 };
            const dirt = { blockId: 2, blockColor: 0 };
            const options = { editBlockColor: true };
            expect(isTileSame(stone, dirt, LAYERS.TILES, options)).toBe(false);
        });

        test('should NOT match different wall paint when editWallColor=true', () => {
            const unpaintedWall = { wallId: 4 };
            const blueWall = { wallId: 4, wallColor: 11 };
            const options = { editWallColor: true };
            expect(isTileSame(unpaintedWall, blueWall, LAYERS.WALLS, options)).toBe(false);
        });

        test('should match different wall paint when editWallColor=false', () => {
            const unpaintedWall = { wallId: 4 };
            const blueWall = { wallId: 4, wallColor: 11 };
            const options = { editWallColor: false };
            expect(isTileSame(unpaintedWall, blueWall, LAYERS.WALLS, options)).toBe(true);
        });

        test('should handle empty options object (matches by ID only)', () => {
            const tile1 = { blockId: 1 };
            const tile2 = { blockId: 1, blockColor: 5 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES, {})).toBe(true);
        });

        test('should handle missing options parameter (matches by ID only)', () => {
            const tile1 = { blockId: 1 };
            const tile2 = { blockId: 1, blockColor: 5 };
            expect(isTileSame(tile1, tile2, LAYERS.TILES)).toBe(true);
        });
    });

    describe('TILEPAINT layer matching', () => {
        test('should match same blockId and same paint color', () => {
            const redStone1 = { blockId: 1, blockColor: 13 };
            const redStone2 = { blockId: 1, blockColor: 13 };
            expect(isTileSame(redStone1, redStone2, LAYERS.TILEPAINT)).toBe(true);
        });

        test('should NOT match different paint colors', () => {
            const stone = { blockId: 1, blockColor: 0 };
            const redStone = { blockId: 1, blockColor: 13 };
            expect(isTileSame(stone, redStone, LAYERS.TILEPAINT)).toBe(false);
        });

        test('should NOT match different blockId', () => {
            const stone = { blockId: 1 };
            const dirt = { blockId: 2 };
            expect(isTileSame(stone, dirt, LAYERS.TILEPAINT)).toBe(false);
        });

        test('should match unpainted tiles (both undefined color)', () => {
            const unpaintedStone1 = { blockId: 1 };
            const unpaintedStone2 = { blockId: 1 };
            expect(isTileSame(unpaintedStone1, unpaintedStone2, LAYERS.TILEPAINT)).toBe(true);
        });
    });

    describe('WALLPAINT layer matching', () => {
        test('should match same wallId and same paint color', () => {
            const blueWall1 = { wallId: 4, wallColor: 11 };
            const blueWall2 = { wallId: 4, wallColor: 11 };
            expect(isTileSame(blueWall1, blueWall2, LAYERS.WALLPAINT)).toBe(true);
        });

        test('should NOT match different paint colors', () => {
            const wall = { wallId: 4, wallColor: 0 };
            const blueWall = { wallId: 4, wallColor: 11 };
            expect(isTileSame(wall, blueWall, LAYERS.WALLPAINT)).toBe(false);
        });

        test('should NOT match different wallId', () => {
            const wall1 = { wallId: 4 };
            const wall2 = { wallId: 5 };
            expect(isTileSame(wall1, wall2, LAYERS.WALLPAINT)).toBe(false);
        });

        test('should match unpainted walls (both undefined color)', () => {
            const unpaintedWall1 = { wallId: 4 };
            const unpaintedWall2 = { wallId: 4 };
            expect(isTileSame(unpaintedWall1, unpaintedWall2, LAYERS.WALLPAINT)).toBe(true);
        });
    });
});
