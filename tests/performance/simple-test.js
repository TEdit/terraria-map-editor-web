/**
 * Simple performance test - no dynamic imports
 * Just paste this into browser console
 */

(function() {
    console.clear();
    console.log('🔍 SIMPLE PERFORMANCE TEST\n');

    if (!window.Main?.state?.canvas?.worldObject) {
        console.error('❌ No map loaded!');
        return;
    }

    const header = window.Main.state.canvas.worldObject.header;
    const layer = window.Main.state.optionbar.layer;

    console.log('✅ Map loaded');
    console.log(`World size: ${header.maxTilesX} x ${header.maxTilesY}`);
    console.log(`Total tiles: ${(header.maxTilesX * header.maxTilesY).toLocaleString()}`);

    const megapixels = (header.maxTilesX * header.maxTilesY) / 1000000;
    console.log(`Canvas size: ${megapixels.toFixed(2)} megapixels\n`);

    // Test just updateLayers - the likely culprit
    console.log('Testing updateLayers performance (10 iterations)...\n');

    const times = [];
    for (let i = 0; i < 10; i++) {
        const start = performance.now();
        window.Main.updateLayers(layer);
        const end = performance.now();
        times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log('Results:');
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms\n`);

    // Analysis
    console.log('📊 ANALYSIS:\n');

    if (avg > 100) {
        console.log('❌ CRITICAL BOTTLENECK: updateLayers');
        console.log(`   Each call takes ${avg.toFixed(0)}ms`);
        console.log(`   This is ${(avg / 16.67).toFixed(1)}x the frame budget!\n`);
        console.log('   During a drag with optimistic rendering:');
        console.log(`   - Optimistic render calls updateLayers: ${avg.toFixed(0)}ms`);
        console.log(`   - Paint layer update (if enabled): +${avg.toFixed(0)}ms`);
        console.log(`   - Batch flush calls it again: +${avg.toFixed(0)}ms`);
        console.log(`   - Total: ${(avg * 2).toFixed(0)}-${(avg * 3).toFixed(0)}ms per drag event!\n`);
        console.log('💡 SOLUTION: Only update dirty regions, not entire canvas');
    } else if (avg > 50) {
        console.log('❌ MAJOR BOTTLENECK: updateLayers');
        console.log(`   Each call takes ${avg.toFixed(0)}ms`);
        console.log(`   With multiple calls per drag, this adds up fast\n`);
        console.log('💡 SOLUTION: Batch updateLayers calls or use dirty rectangles');
    } else if (avg > 16) {
        console.log('⚠️ SLOW: updateLayers');
        console.log(`   Each call takes ${avg.toFixed(0)}ms`);
        console.log(`   Exceeds one frame budget but may be acceptable\n`);
    } else {
        console.log('✅ updateLayers is FAST');
        console.log(`   Each call only takes ${avg.toFixed(2)}ms`);
        console.log(`   Bottleneck must be elsewhere\n`);
    }

    // World size analysis
    if (megapixels > 10) {
        console.log(`⚠️ VERY LARGE WORLD: ${megapixels.toFixed(1)}M pixels`);
        console.log('   putImageData processes the entire canvas each time');
        console.log(`   Estimated data transfer: ${(megapixels * 4).toFixed(1)}MB per call\n`);
    } else if (megapixels > 5) {
        console.log(`⚠️ LARGE WORLD: ${megapixels.toFixed(1)}M pixels`);
        console.log('   Canvas operations will be slower than small worlds\n');
    }

    console.log('🎯 RECOMMENDATION:');
    if (avg > 50) {
        console.log('   Implement dirty rectangle optimization');
        console.log('   Only call putImageData on the region that changed');
        console.log('   This will reduce updateLayers time by ~100x for small edits');
    } else {
        console.log('   Run hot-path-profiler.js to find other bottlenecks');
        console.log('   Profile actual drawing operations');
    }
})();
