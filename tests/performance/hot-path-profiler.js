/**
 * Hot path profiler for tile editing operations
 * Instruments critical functions to find performance bottlenecks
 *
 * Usage in browser console after loading map:
 * 1. Copy and paste this entire file into console
 * 2. Perform tile editing (drag with pencil/brush)
 * 3. Call printHotPaths() to see results
 */

(function() {
    console.clear();
    console.log('🔥 HOT PATH PROFILER - Instrumenting tile editing pipeline\n');

    // Performance tracking
    const profiles = new Map();
    let enabled = true;

    function startProfile(name) {
        if (!enabled) return;
        if (!profiles.has(name)) {
            profiles.set(name, {
                name,
                calls: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0
            });
        }
        profiles.get(name).startTime = performance.now();
    }

    function endProfile(name) {
        if (!enabled) return;
        const profile = profiles.get(name);
        if (!profile || !profile.startTime) return;

        const duration = performance.now() - profile.startTime;
        profile.calls++;
        profile.totalTime += duration;
        profile.minTime = Math.min(profile.minTime, duration);
        profile.maxTime = Math.max(profile.maxTime, duration);
        profile.avgTime = profile.totalTime / profile.calls;
        delete profile.startTime;
    }

    window.printHotPaths = function() {
        if (profiles.size === 0) {
            console.log('No profile data. Perform some tile editing operations first.');
            return;
        }

        const sorted = Array.from(profiles.values())
            .sort((a, b) => b.totalTime - a.totalTime);

        const totalTime = sorted.reduce((sum, p) => sum + p.totalTime, 0);

        console.log('\n🔥 HOT PATHS - Performance Profile\n');
        console.table(sorted.map(p => ({
            'Function': p.name,
            'Calls': p.calls,
            'Total (ms)': p.totalTime.toFixed(2),
            'Avg (ms)': p.avgTime.toFixed(4),
            'Min (ms)': p.minTime.toFixed(4),
            'Max (ms)': p.maxTime.toFixed(4),
            '% of Total': ((p.totalTime / totalTime) * 100).toFixed(1) + '%'
        })));

        console.log(`\nTotal time: ${totalTime.toFixed(2)}ms\n`);
        console.log('🔥 Top 5 Bottlenecks:');
        sorted.slice(0, 5).forEach((p, i) => {
            const pct = ((p.totalTime / totalTime) * 100).toFixed(1);
            console.log(`${i + 1}. ${p.name}: ${p.totalTime.toFixed(2)}ms (${pct}%, avg ${p.avgTime.toFixed(2)}ms)`);
        });
    };

    window.resetHotPaths = function() {
        profiles.clear();
        console.log('🔥 Profile data reset');
    };

    // Instrument renderOptimistic
    const originalRenderOptimistic = window.Main?.renderOptimistic;
    if (originalRenderOptimistic) {
        console.warn('Main.renderOptimistic not found globally, instrumentation may be incomplete');
    }

    // Instrument by monkey-patching key functions
    async function instrumentEditTiles() {
        try {
            // Import the modules we need to instrument
            const colorApp = await import('/src/utils/colorApplication.js');
            const tileRenderer = await import('/src/utils/rendering/tileRenderer.js');

            // Instrument renderOptimistic
            const originalRenderOpt = colorApp.renderOptimistic;
            colorApp.renderOptimistic = function(...args) {
                startProfile('renderOptimistic');
                const result = originalRenderOpt.apply(this, args);
                endProfile('renderOptimistic');
                return result;
            };

            // Instrument renderFromWorldData
            const originalRenderFromWorld = colorApp.renderFromWorldData;
            colorApp.renderFromWorldData = function(...args) {
                startProfile('renderFromWorldData');
                const result = originalRenderFromWorld.apply(this, args);
                endProfile('renderFromWorldData');
                return result;
            };

            // Instrument getTileColor
            const originalGetTileColor = tileRenderer.getTileColor;
            tileRenderer.getTileColor = function(...args) {
                startProfile('getTileColor');
                const result = originalGetTileColor.apply(this, args);
                endProfile('getTileColor');
                return result;
            };

            // Instrument getPaintColor
            const originalGetPaintColor = tileRenderer.getPaintColor;
            tileRenderer.getPaintColor = function(...args) {
                startProfile('getPaintColor');
                const result = originalGetPaintColor.apply(this, args);
                endProfile('getPaintColor');
                return result;
            };

            console.log('✅ Instrumented rendering functions');

        } catch (error) {
            console.error('Failed to instrument functions:', error);
        }
    }

    // Instrument worker calls
    if (window.Main?.workerInterfaces?.editTiles) {
        const originalEditTiles = window.Main.workerInterfaces.editTiles;
        window.Main.workerInterfaces.editTiles = async function(...args) {
            startProfile('worker.editTiles');
            try {
                const result = await originalEditTiles.apply(this, args);
                endProfile('worker.editTiles');
                return result;
            } catch (error) {
                endProfile('worker.editTiles');
                throw error;
            }
        };
        console.log('✅ Instrumented worker.editTiles');
    }

    // Instrument updateLayers
    if (window.Main?.updateLayers) {
        const originalUpdateLayers = window.Main.updateLayers;
        window.Main.updateLayers = function(...args) {
            startProfile('updateLayers');
            const result = originalUpdateLayers.apply(this, args);
            endProfile('updateLayers');
            return result;
        };
        console.log('✅ Instrumented updateLayers');
    }

    // Instrument additional critical operations
    if (window.Main?.listeners) {
        // Track drag events
        let dragEventCount = 0;
        const originalMouseMove = window.Main.listeners.onMouseMove;
        if (originalMouseMove) {
            window.Main.listeners.onMouseMove = function(...args) {
                if (window.Main.listeners.dragging) {
                    dragEventCount++;
                    startProfile('dragEvent');
                }
                const result = originalMouseMove.apply(this, args);
                if (window.Main.listeners.dragging) {
                    endProfile('dragEvent');
                }
                return result;
            };
            console.log('✅ Instrumented drag events');
        }
    }

    // Initialize instrumentation
    instrumentEditTiles();

    console.log('\n📊 Profiler ready!');
    console.log('   1. Perform tile editing (drag with pencil/brush)');
    console.log('   2. Call printHotPaths() to see results');
    console.log('   3. Call resetHotPaths() to clear and start over\n');

    // Add detailed profiling for specific operations
    window.profileDetailedDrag = async function(tileCount = 100) {
        console.log(`\n🔬 Detailed profiling for ${tileCount} tile operation\n`);

        resetHotPaths();

        const tilesArray = Array.from({ length: tileCount }, (_, i) => [
            i % 100,
            Math.floor(i / 100)
        ]);

        const layer = window.Main.state.optionbar.layer;
        const newId = window.Main.state.optionbar.id;
        const maxTilesX = window.Main.state.canvas.worldObject.header.maxTilesX;
        const maxTilesY = window.Main.state.canvas.worldObject.header.maxTilesY;
        const tileEditOptions = window.Main.state.optionbar.tileEditOptions;

        // Import functions
        const { renderOptimistic, renderFromWorldData } = await import('/src/utils/colorApplication.js');

        // Profile optimistic render
        startProfile('TOTAL: Optimistic render');
        renderOptimistic(tilesArray, layer, newId, maxTilesX, maxTilesY, tileEditOptions);
        window.Main.updateLayers(layer);
        endProfile('TOTAL: Optimistic render');

        // Profile worker edit
        startProfile('TOTAL: Worker edit');
        const response = await window.Main.workerInterfaces.editTiles(
            layer,
            "tileslist",
            tilesArray,
            newId,
            undefined,
            tileEditOptions
        );
        endProfile('TOTAL: Worker edit');

        // Profile tiles lookup build
        startProfile('TOTAL: Build lookup');
        const tilesData = {};
        if (response.updatedTiles) {
            response.updatedTiles.forEach(({ x, y, tile }) => {
                tilesData[`${x},${y}`] = tile;
            });
        }
        endProfile('TOTAL: Build lookup');

        // Profile confirm render
        startProfile('TOTAL: Confirm render');
        renderFromWorldData(tilesArray, layer, maxTilesX, maxTilesY, tilesData);
        window.Main.updateLayers(layer);
        endProfile('TOTAL: Confirm render');

        printHotPaths();

        console.log('\n💡 Performance Breakdown:');
        console.log('   - User perceived lag = "TOTAL: Optimistic render" time');
        console.log('   - Background work = "TOTAL: Worker edit" + "TOTAL: Confirm render"');
        console.log('   - Target: Optimistic < 1ms, Worker < 50ms, Confirm < 5ms\n');
    };

    console.log('💡 TIP: Use profileDetailedDrag(1000) for comprehensive 1000-tile profile\n');

})();
