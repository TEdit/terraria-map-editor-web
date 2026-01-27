import Main from "../main.js";

import { onMoveDrag, onMoveDragTouch } from "../tools/move.js";
import { onPencilDrag } from "../tools/pencil.js";
import { onEraserDrag } from "../tools/eraser.js";
import { onSelectionMouseMove } from "../tools/selection.js";

export default function(e) {
    [Main.mousePosImageX, Main.mousePosImageY, Main.mousePosElementX, Main.mousePosElementY] = Main.extensions.getMousePosImage(e, true);

    if ((e.buttons == 4 || e.touches) || (Main.state.toolbar.tool == "move" && e.buttons == 1))
        onMoveDrag(e);
    else if (Main.state.toolbar.tool == "pencil" && e.buttons == 1)
        onPencilDrag(e);
    else if (Main.state.toolbar.tool == "eraser" && e.buttons == 1)
        onEraserDrag(e);
    else if (Main.state.toolbar.tool == "select")
        onSelectionMouseMove(e);
}