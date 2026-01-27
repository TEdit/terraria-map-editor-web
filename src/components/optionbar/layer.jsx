import React from "react";

import LAYERS from "../../utils/dbs/LAYERS.js";
import InputSelect from "../inputs/input-select.jsx";

const options = [
   ["Tiles", LAYERS.TILES],
   ["Walls", LAYERS.WALLS],
   ["Wires", LAYERS.WIRES],
   ["Liquids", LAYERS.LIQUIDS],
];

const optionsEraser = [
   ["Tiles paint", LAYERS.TILEPAINT],
   ["Walls paint", LAYERS.WALLPAINT],
   ["All", 100]
];

function OptionbarOptionLayer({ state, setState, addEraserOptions }) {
   const onChange = (layer) => {
      setState({ ...state, id: null, layer: parseInt(layer) });
   };

   return <InputSelect label="Layer" options={addEraserOptions ? options.concat(optionsEraser) : options} value={state.layer} onChange={onChange}/>;
}

export default OptionbarOptionLayer;
