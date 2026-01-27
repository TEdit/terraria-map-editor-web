import Main from "../main.js";

import { onSelectionMouseDown } from "../tools/selection.js";

export default function(e) {
    [Main.mousePosImageX, Main.mousePosImageY, Main.mousePosElementX, Main.mousePosElementY] = Main.extensions.getMousePosImage(e, true);

    if (e.buttons == 4 || (e.buttons == 1 && Main.state.toolbar.tool == "move"))
        Main.canvas.classList.add("cursorGrabbed");
    else if (Main.state.toolbar.tool == "select")
        onSelectionMouseDown(e);
    else if (Main.state.toolbar.tool == "pencil" || Main.state.toolbar.tool == "eraser") {
        // Initialize drawing start position for pencil/eraser tools
        // This ensures the first drag starts from the mousedown location, not (0,0)
        Main.listeners.drawingStartX = Main.mousePosImageX;
        Main.listeners.drawingStartY = Main.mousePosImageY;
    }
}