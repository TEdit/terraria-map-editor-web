import store from "/state/store.js";
import { stateChangeWorldFile, stateChangeWorldObject, stateToggleViewOption } from "/state/modules/app.js";
import { stateChangePercentage, stateChangeDescription, stateChangeError } from "/state/modules/status.js";
import { saveToLocalSettings } from "/utils/localStorage.js";

import { getCanvasMapData } from "/app/canvas/main.js";

let localState = {
    running: false
};

const DIVIDER = "__DIVIDER__";

const inputElHidden = document.createElement("input");
inputElHidden.setAttribute("type", "file");
inputElHidden.setAttribute("accept", ".wld");
inputElHidden.addEventListener("input", async () => {
   onNewFile(null, inputElHidden.files[0]);
});

const onNewFile = (e, file) => {
    if (file == undefined) {
        inputElHidden.click();
    } else {
        onCloseFile();
        store.dispatch(stateChangeWorldFile(file));
    }
}

const onSaveFile = (e) => {
    console.log("clicked save file");
}

const onSaveImage = () => {
    const data = getCanvasMapData({name: true, imageUrlPng: true});

    if (data !== null) {
        const link = document.createElement("a");
        link.download = data.name.replace(" ", "_") + ".png";
        link.href = data.imageUrlPng;
        link.click();
    }
}

const onCloseFile = (e) => {
    store.dispatch(stateChangeWorldFile(null));
    store.dispatch(stateChangeWorldObject(null));
    store.dispatch(stateChangePercentage(null));
    store.dispatch(stateChangeDescription(null));
    store.dispatch(stateChangeError(null));
}

const onExampleMap = (e) => {
    onCloseFile();

    store.dispatch(stateChangeDescription("downloading map"));

    fetch("/downloadable/example_map.wld")
        .then(response => response.blob())
        .then(blob => {
            const file = new File([blob], "example map");
            store.dispatch(stateChangeWorldFile(file));
        })
        .catch(function(e) {
            store.dispatch(stateChangeDescription("failed to download map"));
            console.error(e);
        });
}

const onToggleToolbar = (value) => {
    store.dispatch(stateToggleViewOption("toolbar"));
    saveToLocalSettings("toolbar", value);
}

const onToggleSidebar = (value) => {
    store.dispatch(stateToggleViewOption("sidebar"));
    saveToLocalSettings("sidebar", value);
}

export {
    onNewFile,
    onExampleMap,
    onCloseFile,
    onSaveImage,
    onSaveFile,
    onToggleSidebar,
    onToggleToolbar
};