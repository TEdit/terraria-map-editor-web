/**
 * Performance profiling helpers for finding hot paths
 *
 * Usage:
 * 1. Import: import { profileFunction, startProfile, endProfile, printHotPaths } from './performanceProfiler.js'
 * 2. Wrap functions: const myFunc = profileFunction('myFunc', originalFunc)
 * 3. Or manual: startProfile('operation'); ...; endProfile('operation')
 * 4. View results: printHotPaths()
 */

class PerformanceProfiler {
    constructor() {
        this.enabled = false;
        this.profiles = new Map();
        this.startTimes = new Map();
    }

    enable() {
        this.enabled = true;
        this.reset();
        console.log('🔥 Performance profiling enabled. Use printHotPaths() to view results.');
    }

    disable() {
        this.enabled = false;
        console.log('🔥 Performance profiling disabled.');
    }

    reset() {
        this.profiles.clear();
        this.startTimes.clear();
    }

    startProfile(name) {
        if (!this.enabled) return;
        this.startTimes.set(name, performance.now());
    }

    endProfile(name) {
        if (!this.enabled) return;

        const startTime = this.startTimes.get(name);
        if (!startTime) {
            console.warn(`No start time for profile: ${name}`);
            return;
        }

        const duration = performance.now() - startTime;
        this.startTimes.delete(name);

        if (!this.profiles.has(name)) {
            this.profiles.set(name, {
                name,
                calls: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                avgTime: 0
            });
        }

        const profile = this.profiles.get(name);
        profile.calls++;
        profile.totalTime += duration;
        profile.minTime = Math.min(profile.minTime, duration);
        profile.maxTime = Math.max(profile.maxTime, duration);
        profile.avgTime = profile.totalTime / profile.calls;
    }

    /**
     * Wrap a function to automatically profile it
     */
    profileFunction(name, fn) {
        if (!this.enabled) return fn;

        return (...args) => {
            this.startProfile(name);
            try {
                const result = fn(...args);

                // Handle promises
                if (result && typeof result.then === 'function') {
                    return result.finally(() => this.endProfile(name));
                }

                this.endProfile(name);
                return result;
            } catch (error) {
                this.endProfile(name);
                throw error;
            }
        };
    }

    printHotPaths() {
        if (this.profiles.size === 0) {
            console.log('No profile data collected. Make sure profiling is enabled and operations have been performed.');
            return;
        }

        const sorted = Array.from(this.profiles.values())
            .sort((a, b) => b.totalTime - a.totalTime);

        console.log('\n🔥 HOT PATHS - Performance Profile Results\n');
        console.log('Sorted by total time (highest first)\n');

        const totalAllTime = sorted.reduce((sum, p) => sum + p.totalTime, 0);

        console.table(sorted.map(p => ({
            'Function': p.name,
            'Calls': p.calls,
            'Total (ms)': p.totalTime.toFixed(2),
            'Avg (ms)': p.avgTime.toFixed(4),
            'Min (ms)': p.minTime.toFixed(4),
            'Max (ms)': p.maxTime.toFixed(4),
            '% of Total': ((p.totalTime / totalAllTime) * 100).toFixed(1) + '%'
        })));

        console.log(`\nTotal profiled time: ${totalAllTime.toFixed(2)}ms\n`);

        // Highlight top 3 bottlenecks
        console.log('🔥 Top 3 Bottlenecks:');
        sorted.slice(0, 3).forEach((p, i) => {
            const pct = ((p.totalTime / totalAllTime) * 100).toFixed(1);
            console.log(`${i + 1}. ${p.name}: ${p.totalTime.toFixed(2)}ms (${pct}% of total, ${p.calls} calls)`);
        });

        console.log('\n💡 Focus optimization efforts on functions with:');
        console.log('   - High "% of Total" (consumes most overall time)');
        console.log('   - High "Avg (ms)" AND high "Calls" (called frequently and slow)');
        console.log('   - High "Max (ms)" (occasional slowness, investigate spikes)\n');
    }

    exportData() {
        return {
            timestamp: new Date().toISOString(),
            profiles: Array.from(this.profiles.values())
        };
    }
}

// Global singleton
const profiler = new PerformanceProfiler();

// Convenience functions
export function enableProfiling() {
    profiler.enable();
}

export function disableProfiling() {
    profiler.disable();
}

export function resetProfiling() {
    profiler.reset();
}

export function startProfile(name) {
    profiler.startProfile(name);
}

export function endProfile(name) {
    profiler.endProfile(name);
}

export function profileFunction(name, fn) {
    return profiler.profileFunction(name, fn);
}

export function printHotPaths() {
    profiler.printHotPaths();
}

export function exportProfilingData() {
    return profiler.exportData();
}

// Make globally available for easy console access
if (typeof window !== 'undefined') {
    window.enableProfiling = enableProfiling;
    window.disableProfiling = disableProfiling;
    window.resetProfiling = resetProfiling;
    window.printHotPaths = printHotPaths;
}

export default profiler;
