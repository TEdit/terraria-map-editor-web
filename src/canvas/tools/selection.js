import Main from "../main.js";

import store from "../../state/store.js";
import { stateChange } from "../../state/state.js";

let startX, startY;

const onSelectionMouseDown = (e) => {
    if (e.buttons === 1) {
        // Left click - start selection
        startX = Main.mousePosImageX;
        startY = Main.mousePosImageY;

        store.dispatch(stateChange(["selection"], {
            active: true,
            x1: startX,
            y1: startY,
            x2: startX,
            y2: startY
        }));
    } else if (e.buttons === 2) {
        // Right click - clear selection
        store.dispatch(stateChange(["selection", "active"], false));
    }
}

const onSelectionMouseMove = (e) => {
    if (e.buttons === 1 && startX !== undefined) {
        // Update selection rectangle
        store.dispatch(stateChange(["selection"], {
            active: true,
            x1: Math.min(startX, Main.mousePosImageX),
            y1: Math.min(startY, Main.mousePosImageY),
            x2: Math.max(startX, Main.mousePosImageX),
            y2: Math.max(startY, Main.mousePosImageY)
        }));
    }
}

const onSelectionMouseUp = (e) => {
    startX = undefined;
    startY = undefined;
}

export {
    onSelectionMouseDown,
    onSelectionMouseMove,
    onSelectionMouseUp
}
