/**
 * Performance profiling for tile editing operations
 * Profiles the actual edit pipeline to find bottlenecks
 *
 * Run in browser console after loading a map
 */

// Copy this entire script and run in browser console after loading a map

(function() {
    console.clear();
    console.log('=== TILE EDITING PERFORMANCE PROFILER ===\n');

    // Performance tracking
    const perf = {
        marks: {},
        measures: []
    };

    function mark(name) {
        perf.marks[name] = performance.now();
    }

    function measure(name, startMark, endMark = null) {
        const start = perf.marks[startMark];
        const end = endMark ? perf.marks[endMark] : performance.now();
        const duration = end - start;
        perf.measures.push({ name, duration });
        return duration;
    }

    function printResults() {
        console.log('\n=== PERFORMANCE RESULTS ===\n');
        perf.measures.forEach(m => {
            const emoji = m.duration < 1 ? '⚡' : m.duration < 10 ? '✅' : m.duration < 50 ? '⚠️' : '❌';
            console.log(`${emoji} ${m.name}: ${m.duration.toFixed(2)}ms`);
        });

        const total = perf.measures.reduce((sum, m) => sum + m.duration, 0);
        console.log(`\n📊 Total: ${total.toFixed(2)}ms`);

        // Find bottlenecks
        const sorted = [...perf.measures].sort((a, b) => b.duration - a.duration);
        console.log('\n🔥 Top 3 Bottlenecks:');
        sorted.slice(0, 3).forEach((m, i) => {
            console.log(`${i + 1}. ${m.name}: ${m.duration.toFixed(2)}ms (${(m.duration/total*100).toFixed(1)}%)`);
        });
    }

    // Test 1: Optimistic rendering performance
    async function testOptimisticRendering() {
        console.log('Test 1: Optimistic Rendering (100 tiles)...');

        const tilesArray = Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10)]);
        const layer = window.Main.state.optionbar.layer;
        const newId = window.Main.state.optionbar.id;
        const maxTilesX = window.Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = window.Main.state.canvas.worldObject.header.maxTilesY;
        const tileEditOptions = window.Main.state.optionbar.tileEditOptions;

        mark('opt-start');

        // Import and call renderOptimistic
        const { renderOptimistic } = await import('/src/utils/colorApplication.js');

        mark('opt-render-start');
        renderOptimistic(tilesArray, layer, newId, maxTilesX, maxTilesY, tileEditOptions);
        mark('opt-render-end');

        mark('opt-update-start');
        window.Main.updateLayers(layer);
        mark('opt-update-end');

        measure('Optimistic: Render tiles', 'opt-render-start', 'opt-render-end');
        measure('Optimistic: Update layers', 'opt-update-start', 'opt-update-end');
        measure('Optimistic: TOTAL', 'opt-start', 'opt-update-end');
    }

    // Test 2: Worker edit tiles performance
    async function testWorkerEditTiles() {
        console.log('Test 2: Worker editTiles (100 tiles)...');

        const tilesArray = Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10)]);
        const layer = window.Main.state.optionbar.layer;
        const newId = window.Main.state.optionbar.id;
        const tileEditOptions = window.Main.state.optionbar.tileEditOptions;

        mark('worker-start');
        const response = await window.Main.workerInterfaces.editTiles(
            layer,
            "tileslist",
            tilesArray,
            newId,
            undefined,
            tileEditOptions
        );
        mark('worker-end');

        measure('Worker: editTiles roundtrip', 'worker-start', 'worker-end');
        console.log(`  Tiles returned: ${response.updatedTiles?.length || 0}`);
    }

    // Test 3: Building tiles lookup
    function testTilesLookupBuild() {
        console.log('Test 3: Building tiles lookup (1000 tiles)...');

        const updatedTiles = Array.from({ length: 1000 }, (_, i) => ({
            x: i % 100,
            y: Math.floor(i / 100),
            tile: { blockId: 1, blockColor: 5 }
        }));

        mark('lookup-start');
        const tilesData = {};
        updatedTiles.forEach(({ x, y, tile }) => {
            tilesData[`${x},${y}`] = tile;
        });
        mark('lookup-end');

        measure('Build tiles lookup (1000 tiles)', 'lookup-start', 'lookup-end');
    }

    // Test 4: Rendering from worker data
    async function testRenderFromWorkerData() {
        console.log('Test 4: Render from worker data (100 tiles)...');

        const tilesArray = Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10)]);
        const layer = window.Main.state.optionbar.layer;
        const maxTilesX = window.Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = window.Main.state.canvas.worldObject.header.maxTilesY;

        // Simulate worker response
        const tilesData = {};
        tilesArray.forEach(([x, y]) => {
            tilesData[`${x},${y}`] = { blockId: 1 };
        });

        const { renderFromWorldData } = await import('/src/utils/colorApplication.js');

        mark('render-start');
        renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);
        mark('render-end');

        mark('update-start');
        window.Main.updateLayers(layer);
        mark('update-end');

        measure('Render from worker data', 'render-start', 'render-end');
        measure('Update layers', 'update-start', 'update-end');
        measure('Render + Update TOTAL', 'render-start', 'update-end');
    }

    // Test 5: Full drag operation simulation
    async function testFullDragOperation() {
        console.log('Test 5: Full drag operation (pencil, 100 tiles)...');

        const tilesArray = Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10)]);
        const layer = window.Main.state.optionbar.layer;
        const newId = window.Main.state.optionbar.id;
        const maxTilesX = window.Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = window.Main.state.canvas.worldObject.header.maxTilesY;
        const tileEditOptions = window.Main.state.optionbar.tileEditOptions;

        const { renderOptimistic, renderFromWorldData } = await import('/src/utils/colorApplication.js');

        mark('full-start');

        // 1. Optimistic render (instant feedback)
        mark('full-opt-start');
        renderOptimistic(tilesArray, layer, newId, maxTilesX, maxTilesY, tileEditOptions);
        window.Main.updateLayers(layer);
        mark('full-opt-end');

        // 2. Worker edit
        mark('full-worker-start');
        const response = await window.Main.workerInterfaces.editTiles(
            layer,
            "tileslist",
            tilesArray,
            newId,
            undefined,
            tileEditOptions
        );
        mark('full-worker-end');

        // 3. Build lookup
        mark('full-lookup-start');
        const tilesData = {};
        if (response.updatedTiles) {
            response.updatedTiles.forEach(({ x, y, tile }) => {
                tilesData[`${x},${y}`] = tile;
            });
        }
        mark('full-lookup-end');

        // 4. Confirm render
        mark('full-confirm-start');
        renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);
        window.Main.updateLayers(layer);
        mark('full-confirm-end');

        mark('full-end');

        measure('Full: 1. Optimistic render', 'full-opt-start', 'full-opt-end');
        measure('Full: 2. Worker edit', 'full-worker-start', 'full-worker-end');
        measure('Full: 3. Build lookup', 'full-lookup-start', 'full-lookup-end');
        measure('Full: 4. Confirm render', 'full-confirm-start', 'full-confirm-end');
        measure('Full: TOTAL END-TO-END', 'full-start', 'full-end');
        measure('Full: USER PERCEIVED (optimistic only)', 'full-start', 'full-opt-end');
    }

    // Test 6: Batch performance (simulating drag)
    async function testBatchPerformance() {
        console.log('Test 6: Batch performance (10 drag events, 1000 tiles total)...');

        const layer = window.Main.state.optionbar.layer;
        const newId = window.Main.state.optionbar.id;
        const maxTilesX = window.Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = window.Main.state.canvas.worldObject.header.maxTilesY;
        const tileEditOptions = window.Main.state.optionbar.tileEditOptions;

        const { renderOptimistic } = await import('/src/utils/colorApplication.js');

        mark('batch-start');

        // Simulate 10 drag events
        for (let event = 0; event < 10; event++) {
            const tilesArray = Array.from({ length: 100 }, (_, i) => [
                (i + event * 100) % 100,
                Math.floor((i + event * 100) / 100)
            ]);

            // Each event does optimistic render
            renderOptimistic(tilesArray, layer, newId, maxTilesX, maxTilesY, tileEditOptions);
            window.Main.updateLayers(layer);
        }

        mark('batch-opt-end');

        // Then one batch worker call for all 1000 tiles
        const allTiles = Array.from({ length: 1000 }, (_, i) => [i % 100, Math.floor(i / 100)]);

        mark('batch-worker-start');
        await window.Main.workerInterfaces.editTiles(
            layer,
            "tileslist",
            allTiles,
            newId,
            undefined,
            tileEditOptions
        );
        mark('batch-worker-end');

        measure('Batch: 10 optimistic renders', 'batch-start', 'batch-opt-end');
        measure('Batch: 1 worker call (1000 tiles)', 'batch-worker-start', 'batch-worker-end');
        measure('Batch: TOTAL', 'batch-start', 'batch-worker-end');
    }

    // Run all tests
    async function runAllTests() {
        try {
            if (!window.Main?.state?.canvas?.worldObject) {
                console.error('❌ Please load a map first!');
                return;
            }

            await testOptimisticRendering();
            await testWorkerEditTiles();
            testTilesLookupBuild();
            await testRenderFromWorkerData();
            await testFullDragOperation();
            await testBatchPerformance();

            printResults();

            console.log('\n💡 Performance Targets:');
            console.log('  ⚡ Optimistic render: <1ms (instant feedback)');
            console.log('  ✅ Worker roundtrip: <50ms (acceptable)');
            console.log('  ✅ Tiles lookup build: <1ms for 1000 tiles');
            console.log('  ✅ Confirm render: <5ms');
            console.log('  🎯 User perceived lag: <1ms (optimistic only)');

        } catch (error) {
            console.error('Error running tests:', error);
        }
    }

    // Start profiling
    console.log('Starting performance profiling...\n');
    runAllTests().then(() => {
        console.log('\n✅ Profiling complete!');
    });

})();
