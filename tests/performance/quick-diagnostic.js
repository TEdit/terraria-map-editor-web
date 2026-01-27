/**
 * Quick diagnostic for finding why drawing is slow
 * Copy/paste into browser console after loading map
 */

(function() {
    console.clear();
    console.log('🔍 QUICK PERFORMANCE DIAGNOSTIC\n');

    // Check if map is loaded
    if (!window.Main?.state?.canvas?.worldObject) {
        console.error('❌ No map loaded! Load a map first.');
        return;
    }

    console.log('✅ Map loaded\n');

    // Test 1: Simple draw line geometry calculation
    console.log('Test 1: Geometry calculation (drawLine)...');
    performance.mark('geo-start');

    // Simulate drawing a 100px line
    const points = [];
    for (let i = 0; i < 100; i++) {
        points.push({x: i, y: i});
    }

    performance.mark('geo-end');
    performance.measure('geometry', 'geo-start', 'geo-end');
    const geoTime = performance.getEntriesByName('geometry')[0].duration;
    console.log(`  ${geoTime.toFixed(2)}ms - ${geoTime < 1 ? '✅' : '❌'} (target: <1ms)\n`);

    // Test 2: Render optimistic (just the render, no worker)
    console.log('Test 2: Optimistic render (100 tiles)...');

    const testTiles = Array.from({ length: 100 }, (_, i) => [
        i % 10,
        Math.floor(i / 10)
    ]);

    import('/src/utils/colorApplication.js').then(({ renderOptimistic }) => {
        performance.mark('render-start');

        renderOptimistic(
            testTiles,
            window.Main.state.optionbar.layer,
            window.Main.state.optionbar.id,
            window.Main.state.canvas.worldObject.header.maxTilesX,
            window.Main.state.canvas.worldObject.header.maxTilesY,
            window.Main.state.optionbar.tileEditOptions
        );

        performance.mark('render-end');
        performance.measure('render-optimistic', 'render-start', 'render-end');
        const renderTime = performance.getEntriesByName('render-optimistic')[0].duration;
        console.log(`  ${renderTime.toFixed(2)}ms - ${renderTime < 5 ? '✅' : '❌'} (target: <5ms)\n`);

        // Test 3: updateLayers (canvas putImageData)
        console.log('Test 3: updateLayers (canvas operations)...');
        performance.mark('update-start');

        window.Main.updateLayers(window.Main.state.optionbar.layer);

        performance.mark('update-end');
        performance.measure('update-layers', 'update-start', 'update-end');
        const updateTime = performance.getEntriesByName('update-layers')[0].duration;
        console.log(`  ${updateTime.toFixed(2)}ms - ${updateTime < 10 ? '✅' : '❌'} (target: <10ms)\n`);

        // Test 4: Full drag event simulation
        console.log('Test 4: Full drag event (what user experiences)...');
        performance.mark('drag-start');

        // Render optimistic
        renderOptimistic(
            testTiles,
            window.Main.state.optionbar.layer,
            window.Main.state.optionbar.id,
            window.Main.state.canvas.worldObject.header.maxTilesX,
            window.Main.state.canvas.worldObject.header.maxTilesY,
            window.Main.state.optionbar.tileEditOptions
        );

        // Update canvas
        window.Main.updateLayers(window.Main.state.optionbar.layer);

        performance.mark('drag-end');
        performance.measure('drag-event', 'drag-start', 'drag-end');
        const dragTime = performance.getEntriesByName('drag-event')[0].duration;
        console.log(`  ${dragTime.toFixed(2)}ms - ${dragTime < 16 ? '✅' : '❌'} (target: <16ms for 60fps)\n`);

        // Test 5: Worker roundtrip
        console.log('Test 5: Worker edit (background, async)...');
        const workerStart = performance.now();

        window.Main.workerInterfaces.editTiles(
            window.Main.state.optionbar.layer,
            "tileslist",
            testTiles,
            window.Main.state.optionbar.id,
            undefined,
            window.Main.state.optionbar.tileEditOptions
        ).then(() => {
            const workerTime = performance.now() - workerStart;
            console.log(`  ${workerTime.toFixed(2)}ms - ${workerTime < 50 ? '✅' : '❌'} (target: <50ms)\n`);

            // Summary
            console.log('\n📊 DIAGNOSTIC SUMMARY\n');

            const total = dragTime + workerTime;

            console.log(`User perceived lag: ${dragTime.toFixed(2)}ms ${dragTime < 16 ? '✅ Good' : '❌ TOO SLOW'}`);
            console.log(`Background work: ${workerTime.toFixed(2)}ms ${workerTime < 50 ? '✅ Good' : '⚠️ Slow'}`);
            console.log(`Total end-to-end: ${total.toFixed(2)}ms\n`);

            // Identify bottleneck
            console.log('🔥 BOTTLENECK IDENTIFICATION:\n');

            if (updateTime > dragTime * 0.5) {
                console.log('❌ BOTTLENECK: updateLayers (canvas putImageData)');
                console.log('   - Canvas operations are slow');
                console.log('   - Possible causes:');
                console.log('     • Large world size causing huge ImageData');
                console.log('     • Multiple layer updates per drag event');
                console.log('     • Browser rendering pipeline stalled');
                console.log('   - Solutions:');
                console.log('     • Reduce number of updateLayers calls');
                console.log('     • Use OffscreenCanvas if available');
                console.log('     • Optimize viewport rendering only');
            } else if (renderTime > dragTime * 0.5) {
                console.log('❌ BOTTLENECK: renderOptimistic (color calculation)');
                console.log('   - Tile color calculation is slow');
                console.log('   - Run hot-path-profiler.js for details');
                console.log('   - Likely culprit: getTileColor being called too much');
            } else if (geoTime > 1) {
                console.log('❌ BOTTLENECK: Geometry calculations');
                console.log('   - Line interpolation or brush shape calculations slow');
            } else if (workerTime > 100) {
                console.log('⚠️ WARNING: Worker is slow');
                console.log('   - Worker operations taking >100ms');
                console.log('   - Check worker-edit-tiles benchmark');
            } else if (dragTime > 16) {
                console.log('❌ BOTTLENECK: Unknown - multiple small issues');
                console.log('   - Run hot-path-profiler.js for detailed breakdown');
            } else {
                console.log('✅ NO BOTTLENECK DETECTED!');
                console.log('   - All operations within performance budget');
                console.log('   - If you still experience lag:');
                console.log('     • Check Chrome DevTools Performance tab');
                console.log('     • Look for long tasks or garbage collection');
                console.log('     • Check if browser is throttling (dev tools open?)');
            }

            console.log('\n💡 Next steps:');
            console.log('   1. If bottleneck found: Focus optimization there');
            console.log('   2. If no bottleneck: Run hot-path-profiler.js during actual drawing');
            console.log('   3. Use Chrome DevTools Performance tab to record actual lag');
        });
    });

})();
