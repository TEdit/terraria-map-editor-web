/**
 * Performance benchmarks for tile operations
 * Run with: node tests/performance/tile-operations.bench.js
 */

// Simple benchmark harness
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

    console.log(`${name}:`);
    console.log(`  Total: ${total.toFixed(2)}ms`);
    console.log(`  Average: ${avg.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${(1000 / avg).toFixed(0)}`);
    console.log();

    return { total, avg, opsPerSec: 1000 / avg };
}

// Mock ImageData for Node.js environment
class MockImageData {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
    }
}

// Benchmark: Building tiles lookup map
benchmark('Build tiles lookup (100 tiles)', () => {
    const tilesData = {};
    const updatedTiles = Array.from({ length: 100 }, (_, i) => ({
        x: i % 10,
        y: Math.floor(i / 10),
        tile: { blockId: 1 }
    }));

    updatedTiles.forEach(({ x, y, tile }) => {
        tilesData[`${x},${y}`] = tile;
    });
}, 10000);

// Benchmark: Building tiles lookup map (1000 tiles)
benchmark('Build tiles lookup (1000 tiles)', () => {
    const tilesData = {};
    const updatedTiles = Array.from({ length: 1000 }, (_, i) => ({
        x: i % 100,
        y: Math.floor(i / 100),
        tile: { blockId: 1 }
    }));

    updatedTiles.forEach(({ x, y, tile }) => {
        tilesData[`${x},${y}`] = tile;
    });
}, 1000);

// Benchmark: Rendering tiles to ImageData (100 tiles)
benchmark('Render 100 tiles to ImageData', () => {
    const imageData = new MockImageData(1000, 1000);
    const tilesArray = Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10)]);

    tilesArray.forEach(([x, y]) => {
        const offset = (1000 * y + x) * 4;
        imageData.data[offset] = 255;     // r
        imageData.data[offset + 1] = 0;   // g
        imageData.data[offset + 2] = 0;   // b
        imageData.data[offset + 3] = 255; // a
    });
}, 10000);

// Benchmark: Rendering tiles to ImageData (1000 tiles)
benchmark('Render 1000 tiles to ImageData', () => {
    const imageData = new MockImageData(1000, 1000);
    const tilesArray = Array.from({ length: 1000 }, (_, i) => [i % 100, Math.floor(i / 100)]);

    tilesArray.forEach(([x, y]) => {
        const offset = (1000 * y + x) * 4;
        imageData.data[offset] = 255;
        imageData.data[offset + 1] = 0;
        imageData.data[offset + 2] = 0;
        imageData.data[offset + 3] = 255;
    });
}, 1000);

// Benchmark: Set operations for deduplication
benchmark('Set operations (1000 items)', () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) {
        set.add(`${i % 100},${Math.floor(i / 100)}`);
    }
    const has = set.has('50,5');
}, 1000);

// Benchmark: Map operations for tile lookup
benchmark('Map operations (1000 items)', () => {
    const map = new Map();
    for (let i = 0; i < 1000; i++) {
        map.set(`${i % 100},${Math.floor(i / 100)}`, { blockId: 1 });
    }
    const tile = map.get('50,5');
}, 1000);

// Benchmark: Array filter (1000 items)
benchmark('Array filter (1000 items)', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => [i % 100, Math.floor(i / 100)]);
    const filtered = arr.filter(([x, y]) => x >= 0 && y >= 0 && x < 100 && y < 100);
}, 1000);

// Benchmark: Array forEach vs for loop
benchmark('Array forEach (1000 items)', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    let sum = 0;
    arr.forEach(n => sum += n);
}, 10000);

benchmark('for loop (1000 items)', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
}, 10000);

console.log('Performance benchmarks complete!');
console.log('\nTarget performance:');
console.log('  - Tile lookup build: <0.1ms for 100 tiles, <1ms for 1000 tiles');
console.log('  - Rendering: <1ms for 100 tiles, <10ms for 1000 tiles');
console.log('  - Map/Set operations: <0.001ms per operation');
