# Drawing Tool Flow Analysis

## Expected Behavior

### Click Event
1. Mouse position is updated from click event
2. `onPencilClick()` is called
3. Should:
   - Set `drawingStartX/Y = mousePosImageX/Y`
   - Generate brush tiles at click position
   - Apply color to those tiles
   - Update display

### Drag Event (first)
1. `onPencilDrag()` is called
2. Should:
   - Set `dragging = true`
   - Draw line from `drawingStartX/Y` to `mousePosImageX/Y`
   - Stamp brush at each point along line
   - Apply color to all stamped tiles
   - Update `drawingStartX/Y = mousePosImageX/Y` for next drag segment
   - Update display

### Drag Event (subsequent)
1. `onPencilDrag()` is called
2. Should:
   - `dragging` already true, skip
   - Draw line from **previous** `drawingStartX/Y` to current `mousePosImageX/Y`
   - Stamp brush at each point along line
   - Apply color to all stamped tiles
   - Update `drawingStartX/Y = mousePosImageX/Y` for next segment
   - Update display

### Mouse Up Event
1. `onPencilUp()` is called
2. Should:
   - Set `dragging = false`
   - Stroke ends

---

## Actual Code Flow

### drawingToolsHelpers.js onDrawingToolClick()
```
Sets drawingStartX/Y ✓
Gets brush tiles ✓
Applies operation ✓
```

### drawingToolsHelpers.js onDrawingToolDrag()
```
Sets dragging = true if not already ✓
Checks if mouse moved (but prevMousePosImageX/Y never set) ⚠️
Draws line from drawingStartX/Y to current ✓
Stamps brush at each line point ✓
Updates drawingStartX/Y for next segment ✓
Applies operation ✓
```

### pencil.js onPencilClick()
```
await onDrawingToolClick(applyPencilOperation);
```

### pencil.js onPencilDrag()
```
await onDrawingToolDrag(applyPencilOperation);
```

### pencil.js applyPencilOperation()
```
Applies color to tiles ✓
Calls updateLayers() ✓
Calls editTiles() on worker ✓
```

---

## Potential Issues

1. **Unused `prevMousePosImageX/Y` check**: The early-exit check in drag handler references these but they're never set. This doesn't break anything, just dead code.

2. **`Main.listeners.prevMousePosImageX/Y` never initialized**: Should be set somewhere or check removed.

3. **Eraser doesn't have mouseup handler wired**: Need to check if `onEraserUp` is being called.

4. **Click handler not setting `dragging = true`**: The initial click doesn't set dragging, only the first drag does. This is actually correct because:
   - Click: dragging = false, so we execute click logic
   - Drag: if dragging still false, set to true, then execute drag logic
   - Next drag: dragging = true, so skip first check, execute drag logic

5. **Selection filtering**: Both click and drag filter tiles through selection. This is correct.

6. **Line interpolation on subsequent drags**: Each drag should draw from the **previous** end point (stored in drawingStartX/Y), not from the click point. This is implemented correctly.

---

## What Specifically Seems Broken?

Please clarify one of:
- Drawing appears with gaps
- Drawing doesn't appear at all
- Drawing appears but in wrong location
- Drawing stops after initial click
- Drawing stops mid-stroke
- Performance issue (slow/frozen)
- Other behavior
