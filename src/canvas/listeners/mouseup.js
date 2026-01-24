import Main from "../main.js";

import { onPencilUp } from "../tools/pencil.js";
import { onEraserUp } from "../tools/eraser.js";
import { onSelectionMouseUp } from "../tools/selection.js";

export default function(e) {
    Main.canvas.classList.remove("cursorGrabbed");

    if (Main.state.toolbar.tool == "pencil")
        onPencilUp(e);
    else if (Main.state.toolbar.tool == "eraser")
        onEraserUp(e);
    else if (Main.state.toolbar.tool == "select")
        onSelectionMouseUp(e);
}