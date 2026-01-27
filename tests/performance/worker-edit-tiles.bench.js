/**
 * Worker-side tile editing performance benchmarks
 * Measures actual tile editing operations in the worker
 *
 * This simulates the worker's editTiles function to find bottlenecks
 * Run with: node tests/performance/worker-edit-tiles.bench.js
 */

const LAYERS = {
    TILES: 0,
    WALLS: 1,
    LIQUIDS: 2,
    WIRES: 3,
    TILEPAINT: 4,
    WALLPAINT: 5
};

// Mock tile data
function createMockTile() {
    return {
        blockId: 1,
        wallId: 1,
        blockColor: 0,
        wallColor: 0
    };
}

// Simulate applyTileEditOptions function from worker
function applyTileEditOptions(tile, options) {
    // Create a copy to avoid RLE issues
    const newTile = { ...tile };

    // Apply block/tile ID
    if (options.editBlockId && options.blockId !== undefined) {
        if (options.blockId === "delete" || options.blockId === null) {
            delete newTile.blockId;
            delete newTile.frameX;
            delete newTile.frameY;
            delete newTile.slope;
            delete newTile.blockColor;
            delete newTile.actuator;
            delete newTile.actuated;
            delete newTile.invisibleBlock;
            delete newTile.fullBrightBlock;
        } else {
            newTile.blockId = parseInt(options.blockId);
            delete newTile.frameX;
            delete newTile.frameY;
        }
    }

    // Apply block paint color (only if tile exists)
    if (options.editBlockColor && newTile.blockId !== undefined) {
        if (options.blockColor === null || options.blockColor === "delete") {
            delete newTile.blockColor;
        } else {
            newTile.blockColor = parseInt(options.blockColor);
        }
    }

    // Apply slope (only if tile exists)
    if (options.editSlope && newTile.blockId !== undefined) {
        if (options.slope === null || options.slope === "delete" || options.slope === undefined) {
            delete newTile.slope;
        } else {
            newTile.slope = options.slope;
        }
    }

    // Apply block coatings
    if (newTile.blockId !== undefined) {
        if (options.editInvisibleBlock) {
            if (options.invisibleBlock) {
                newTile.invisibleBlock = true;
            } else {
                delete newTile.invisibleBlock;
            }
        }

        if (options.editFullBrightBlock) {
            if (options.fullBrightBlock) {
                newTile.fullBrightBlock = true;
            } else {
                delete newTile.fullBrightBlock;
            }
        }
    }

    return newTile;
}

// Benchmark helper
function benchmark(name, fn, iterations = 1000) {
    // Warmup
    for (let i = 0; i < 10; i++) fn();

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = performance.now();

    const total = end - start;
    const avg = total / iterations;
    const opsPerSec = 1000 / avg;

    console.log(`${name}:`);
    console.log(`  Total: ${total.toFixed(2)}ms for ${iterations} iterations`);
    console.log(`  Average: ${avg.toFixed(4)}ms per operation`);
    console.log(`  Throughput: ${opsPerSec.toFixed(0)} ops/sec`);
    console.log();

    return { total, avg, opsPerSec };
}

console.log('=== WORKER TILE EDITING PERFORMANCE ===\n');
console.log('Testing with 1000 tiles per operation (realistic drag scenario)\n');

// Test 1: Simple tile ID change (no options)
benchmark('1. Simple blockId change (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    tiles.forEach(tile => {
        tile.blockId = 5;
    });
});

// Test 2: Object spread (RLE avoidance)
benchmark('2. Tile copy with spread (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    tiles.forEach(tile => {
        const newTile = { ...tile };
        newTile.blockId = 5;
    });
});

// Test 3: Full tileEditOptions (blockId only)
benchmark('3. Apply options - blockId only (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    const options = {
        editBlockId: true,
        blockId: 5
    };

    tiles.forEach(tile => {
        applyTileEditOptions(tile, options);
    });
});

// Test 4: Full tileEditOptions (blockId + paint)
benchmark('4. Apply options - blockId + paint (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    const options = {
        editBlockId: true,
        blockId: 5,
        editBlockColor: true,
        blockColor: 13
    };

    tiles.forEach(tile => {
        applyTileEditOptions(tile, options);
    });
});

// Test 5: Full tileEditOptions (all properties)
benchmark('5. Apply options - ALL properties (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    const options = {
        editBlockId: true,
        blockId: 5,
        editBlockColor: true,
        blockColor: 13,
        editSlope: true,
        slope: "half",
        editInvisibleBlock: true,
        invisibleBlock: true,
        editFullBrightBlock: true,
        fullBrightBlock: true
    };

    tiles.forEach(tile => {
        applyTileEditOptions(tile, options);
    });
});

// Test 6: Building updatedTiles array
benchmark('6. Build updatedTiles array (1000 tiles)', () => {
    const updatedTiles = [];
    for (let i = 0; i < 1000; i++) {
        updatedTiles.push({
            x: i % 100,
            y: Math.floor(i / 100),
            tile: createMockTile()
        });
    }
});

// Test 7: Entire editTiles pipeline simulation
benchmark('7. FULL editTiles pipeline (1000 tiles)', () => {
    const tilesArray = Array.from({ length: 1000 }, (_, i) => [i % 100, Math.floor(i / 100)]);
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    const options = {
        editBlockId: true,
        blockId: 5,
        editBlockColor: true,
        blockColor: 13
    };
    const updatedTiles = [];

    tilesArray.forEach(([x, y], idx) => {
        const tile = tiles[idx];
        const newTile = applyTileEditOptions(tile, options);
        updatedTiles.push({ x, y, tile: newTile });
    });
});

// Test 8: Delete operation (eraser)
benchmark('8. Delete operation - eraser (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => createMockTile());
    const options = {
        editBlockId: true,
        blockId: "delete"
    };

    tiles.forEach(tile => {
        applyTileEditOptions(tile, options);
    });
});

// Test 9: Object property deletion overhead
benchmark('9. Property deletion overhead (1000 tiles)', () => {
    const tiles = Array.from({ length: 1000 }, () => ({
        blockId: 1,
        frameX: 0,
        frameY: 0,
        slope: "half",
        blockColor: 5,
        invisibleBlock: true,
        fullBrightBlock: true
    }));

    tiles.forEach(tile => {
        delete tile.blockId;
        delete tile.frameX;
        delete tile.frameY;
        delete tile.slope;
        delete tile.blockColor;
        delete tile.invisibleBlock;
        delete tile.fullBrightBlock;
    });
});

// Test 10: postMessage overhead (simulated)
benchmark('10. JSON stringify (postMessage simulation)', () => {
    const updatedTiles = Array.from({ length: 1000 }, (_, i) => ({
        x: i % 100,
        y: Math.floor(i / 100),
        tile: createMockTile()
    }));

    JSON.stringify(updatedTiles);
});

console.log('\n=== PERFORMANCE ANALYSIS ===\n');
console.log('Target for 1000 tiles per frame at 60fps:');
console.log('  - Maximum time budget: 16.67ms per frame');
console.log('  - Tile editing should be: <5ms');
console.log('  - Building response: <2ms');
console.log('  - postMessage overhead: <3ms');
console.log('  - Total worker time: <10ms');
console.log('  - Remaining for render: ~6ms');
console.log('\nBottleneck Analysis:');
console.log('  - If Test 7 (full pipeline) > 5ms: Worker logic is bottleneck');
console.log('  - If Test 10 (stringify) > 3ms: postMessage is bottleneck');
console.log('  - If Test 3-5 have large differences: tileEditOptions overhead');
console.log('\n✅ Good performance: All operations complete in <10ms total');
console.log('⚠️  Needs optimization: Any single operation >5ms');
console.log('❌ Critical: Total >16ms (can\'t maintain 60fps)');
