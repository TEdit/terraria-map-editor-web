import Main from "../main.js";

import store from "../../state/store.js";
import { stateChange, stateFire } from "../../state/state.js";

import { onPencilClick } from "../tools/pencil.js";
import { onBucketClick } from "../tools/bucket.js";
import { onEraserClick } from "../tools/eraser.js";

export default function(e) {
    // Update mouse position from the click event
    [Main.mousePosImageX, Main.mousePosImageY, Main.mousePosElementX, Main.mousePosElementY] = Main.extensions.getMousePosImage(e, true);

    store.dispatch(stateFire(["canvas", "events", "click"]));

    if (Main.state.toolbar.tool == "pencil")
        onPencilClick(e);
    else if (Main.state.toolbar.tool == "bucket")
        onBucketClick(e);
    else if (Main.state.toolbar.tool == "eraser")
        onEraserClick(e);
}