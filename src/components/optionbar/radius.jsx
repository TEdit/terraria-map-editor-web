import React from "react";
import InputSlider from "../inputs/input-slider.jsx";

/**
 * Radius option for bucket fill tool
 * Constrains flood fill to Manhattan distance from click point
 */
function OptionbarOptionRadius({ state, setState }) {
   const onChangeRadius = (newRadius) => {
      setState({...state, radius: parseInt(newRadius)});
   };

   return (
      <InputSlider
         label="Fill radius"
         value={state.radius}
         min={50}
         max={2000}
         onChange={onChangeRadius}
         sliderWidth="6rem"
         input
         inputMin={10}
         inputMax={99999}
         inputWidth="6ch"
      />
   );
}

export default OptionbarOptionRadius;
