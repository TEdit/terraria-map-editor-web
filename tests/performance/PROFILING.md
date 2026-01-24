# Performance Profiling Guide

This guide explains how to find "hot paths" - the most expensive lines of code consuming CPU time.

## Quick Start

### Browser Hot Path Profiling (Recommended)

**Find exact bottlenecks in tile editing:**

1. Load a map in the editor
2. Open browser console (F12)
3. Copy and paste [`hot-path-profiler.js`](./hot-path-profiler.js) into console
4. Drag with pencil/brush tool
5. Run: `printHotPaths()`

**Output shows:**
- Which functions consume the most time
- Average, min, max times per call
- Percentage of total execution time
- Top bottlenecks ranked

**Example output:**
```
🔥 Top 5 Bottlenecks:
1. renderOptimistic: 245.32ms (45%, avg 0.82ms)
2. getTileColor: 128.45ms (24%, avg 0.0043ms)
3. worker.editTiles: 89.23ms (16%, avg 22.31ms)
4. updateLayers: 78.91ms (15%, avg 2.63ms)
5. getPaintColor: 12.34ms (2%, avg 0.0041ms)
```

### Detailed 1000-Tile Profile

For comprehensive bottleneck analysis:

```javascript
// In browser console:
profileDetailedDrag(1000);
```

This profiles a complete 1000-tile operation including:
- Optimistic render time (user perceived lag)
- Worker processing time
- Lookup building time
- Confirm render time

**Performance targets:**
- Optimistic render: <1ms (instant feedback)
- Worker edit: <50ms (acceptable background work)
- Confirm render: <5ms (verification)

## Profiling Methods

### 1. Hot Path Profiler (Best for Finding Bottlenecks)

**What it does:**
- Instruments critical functions automatically
- Tracks call count, total time, avg/min/max times
- Shows percentage of total execution time

**When to use:**
- Finding which functions are slowest
- Identifying frequently-called expensive operations
- Comparing time spent in different parts of pipeline

**Files:**
- [`hot-path-profiler.js`](./hot-path-profiler.js) - Browser console script
- [`performanceProfiler.js`](../../src/utils/performanceProfiler.js) - Reusable profiler class

### 2. Chrome DevTools Performance Tab

**What it does:**
- Records complete performance trace
- Shows flame graphs (call stack over time)
- Identifies long tasks, layout thrashing, etc.

**When to use:**
- Visualizing execution flow
- Finding unexpected function calls
- Detecting frame drops and jank

**Steps:**
1. Open DevTools → Performance tab
2. Click Record (red dot)
3. Perform tile editing operation
4. Stop recording
5. Analyze flame graph

**What to look for:**
- **Wide bars** = functions consuming most time
- **Tall stacks** = deep call chains (may indicate inefficiency)
- **Yellow/red bars** = long tasks blocking main thread
- **Self Time vs Total Time** = whether time is in function itself or its children

### 3. Chrome DevTools CPU Profiler

**What it does:**
- Shows time spent per function and line
- Can export data for offline analysis

**Steps:**
1. DevTools → Sources tab → Profiler (or dedicated Profiler tab)
2. Click "Start"
3. Perform operation
4. Stop profiler
5. View "Heavy (Bottom Up)" or "Chart" view

**Best for:**
- Line-by-line timing
- Identifying specific slow code sections
- Exporting data for comparison

### 4. Node.js Profiling (For Benchmarks)

**Profile the worker-edit-tiles benchmark:**

```bash
# Run with built-in profiler
node --prof tests/performance/worker-edit-tiles.bench.js

# Process the profile
node --prof-process isolate-*.log > profile.txt

# View profile.txt to see hot functions
```

**What it shows:**
- CPU time by function (ticks)
- Call tree with percentages
- Native vs JavaScript time

**Best for:**
- Profiling worker-side operations
- Finding bottlenecks in non-browser code
- Comparing different implementations

### 5. Manual Performance Marks

**Add custom timing to your code:**

```javascript
import { startProfile, endProfile, printHotPaths } from './performanceProfiler.js';

// Enable profiling
enableProfiling();

// In your function:
startProfile('myOperation');
// ... code to measure ...
endProfile('myOperation');

// View results
printHotPaths();
```

**Or use browser native marks:**

```javascript
performance.mark('start');
// ... operation ...
performance.mark('end');
performance.measure('operation', 'start', 'end');

console.table(performance.getEntriesByType('measure'));
```

## Interpreting Results

### Key Metrics

**Total Time:**
- Shows cumulative impact across all calls
- High total = optimization will have big impact
- Target functions with >10% of total time

**Average Time:**
- Shows cost per call
- High avg + high calls = hot path
- Target functions with >1ms average

**Call Count:**
- Shows how frequently function is called
- High calls + high avg = major bottleneck
- Even small per-call savings add up

**Percentage of Total:**
- Shows relative importance
- Focus on top 3-5 functions (usually 80% of time)
- Ignore anything <1% unless called millions of times

### Example Analysis

```
Function               Calls  Total    Avg      % of Total
getTileColor           30000  245ms    0.008ms  45%
renderOptimistic       300    82ms     0.273ms  15%
updateLayers           300    78ms     0.260ms  14%
```

**Analysis:**
- `getTileColor` is called 30,000 times (100 tiles × 300 drag events)
- Despite fast per-call (0.008ms), it dominates total time (45%)
- **Optimization strategy:** Reduce calls or optimize the function itself
- `renderOptimistic` and `updateLayers` are also worth optimizing

### Common Bottlenecks

**Rendering:**
- `getTileColor` / `getPaintColor` - Color calculation
- `renderOptimistic` / `renderFromWorldData` - Canvas painting
- `updateLayers` - putImageData calls

**Data Operations:**
- `worker.editTiles` - Worker roundtrip
- Building `tilesData` lookup - Object creation
- `JSON.stringify` / `postMessage` - Serialization

**Geometry:**
- `fillEllipseCentered` / `fillRectangleCentered` - Brush shapes
- `drawLine` - Line interpolation
- `deduplicateTiles` - Set operations

## Optimization Workflow

1. **Profile** → Identify hot paths
2. **Hypothesize** → Why is it slow?
3. **Optimize** → Make targeted changes
4. **Measure** → Verify improvement
5. **Repeat** → Focus on next bottleneck

### Example: Optimizing getTileColor

**Before profiling:**
```javascript
// Called 30,000 times, total: 245ms (45%)
function getTileColor(tile, layer, id, x, y, opts) {
    // ... complex logic ...
    const color = calculateColor(tile, layer);
    return { r: color[0], g: color[1], b: color[2], a: color[3] };
}
```

**After profiling - found allocation bottleneck:**
```javascript
// Reuse color object
const colorCache = { r: 0, g: 0, b: 0, a: 0 };

function getTileColor(tile, layer, id, x, y, opts) {
    // ... complex logic ...
    const color = calculateColor(tile, layer);
    colorCache.r = color[0];
    colorCache.g = color[1];
    colorCache.b = color[2];
    colorCache.a = color[3];
    return colorCache;
}
```

**Result:** 245ms → 180ms (27% faster)

## Performance Targets

Based on 60fps (16.67ms frame budget):

### Per-Frame Operations

**Optimistic Rendering (User Perceived):**
- ⚡ Target: <1ms (imperceptible)
- ✅ Acceptable: <5ms (minimal lag)
- ⚠️ Warning: 5-10ms (noticeable)
- ❌ Critical: >10ms (laggy)

**Background Operations:**
- Worker edit: <50ms (async, doesn't block UI)
- Confirm render: <5ms (quick verification)

### Per-Call Operations

**High-frequency (called 1000s of times):**
- getTileColor: <0.01ms per call
- Object property access: <0.001ms
- Array operations: <0.001ms per item

**Medium-frequency (called 100s of times):**
- renderOptimistic: <1ms per call
- Worker batch: <50ms per batch
- updateLayers: <3ms per call

**Low-frequency (called <10 times):**
- Full render: <500ms
- File save: <2000ms
- Map load: <5000ms

## Troubleshooting

### "No profile data collected"

**Problem:** Functions not instrumented or not called

**Fix:**
1. Make sure profiling is enabled: `enableProfiling()`
2. Perform operations after enabling
3. Check console for instrumentation errors

### High variance (max >> avg)

**Problem:** Occasional slowdowns, not consistent

**Possible causes:**
- Garbage collection pauses
- First-call initialization overhead
- Cache misses
- Browser throttling

**Fix:**
- Run warmup iterations
- Profile multiple times
- Check DevTools Performance tab for long tasks

### Different results in profiler vs benchmarks

**Problem:** Instrumentation overhead affects measurements

**Explanation:**
- Hot path profiler adds overhead per function call
- Benchmarks run uninstrumented code (faster)
- Use benchmarks for absolute timing, profiler for relative

**Best practice:**
- Benchmarks: Measure raw performance
- Profiler: Find which functions to optimize

## Advanced: Flame Graphs

Visualize hot paths with flame graphs:

1. DevTools → Performance → Record
2. Stop recording
3. Bottom-Up or Flame Chart view
4. Hover over wide sections (hot paths)
5. Click to zoom into specific call stacks

**Reading flame graphs:**
- **Width** = time consumed
- **Height** = call stack depth
- **Color** = category (JS, rendering, etc.)
- **Hover** = shows function name and time

## Tools Summary

| Tool | Best For | Overhead | Granularity |
|------|----------|----------|-------------|
| Hot Path Profiler | Finding bottlenecks | Medium | Function-level |
| DevTools Performance | Visualizing flow | Low | Frame-level |
| DevTools Profiler | Line-by-line | Low | Line-level |
| Node.js --prof | Worker benchmarks | Very low | Function-level |
| Manual marks | Custom timing | Minimal | Custom |

## Next Steps

1. Run `hot-path-profiler.js` to find current bottlenecks
2. Focus optimization on top 3 functions by % of total time
3. Verify improvements with benchmarks
4. Document optimizations in PERFORMANCE.md
