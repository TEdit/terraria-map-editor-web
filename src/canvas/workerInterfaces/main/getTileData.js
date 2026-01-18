import Main from "../../main.js";

import WorkerError from "../errors/WorkerError.js";

export default function(x, y) {
    return new Promise((resolve, reject) => {
        Main.worker.onmessage = ({ data }) => {
            switch(data.action) {
                case "ERROR":
                    WorkerError("getTileData", data.e);
                    resolve(null);
                    break;

                case "RETURN_TILE_DATA":
                    resolve(data.tileData);
                    break;
            }
        }

        Main.worker.postMessage({
            action: "GET_TILE_DATA",
            x,
            y
        });
    });
}