import React, { useState } from "react";

import "/components/styles/optionbar/input.css";

function OptionbarInputSlider({ label, value, onChange, float, min, max, roundTo = 2, sliderWidth, input, inputWidth, className }) {
   const shift = Math.pow(10, roundTo);
   let unshifted;
   if (float) {
      unshifted = {
         value: (value == -0 || value == "-0.") ? value : Math.round(value * shift) / shift,
         min,
         max,
         onChange: (e) => {
            if (e.target.value.endsWith(".") && !e.target.value.replace(/.$/, "").includes("."))
               onChange(e.target.value);
            else if (!isNaN(e.target.value) && e.target.value >= unshifted.min && e.target.value <= unshifted.max)
               if (e.target.value > 0)
                  onChange(Math.floor(e.target.value * shift) / shift);
               else
                  onChange(Math.ceil(e.target.value * shift) / shift);
            else if (e.target.value.endsWith("-") && e.target.value.charAt(0) != "-")
               onChange("-" + e.target.value.replace("-", ""));
            else if (e.target.value.endsWith("+") && e.target.value.charAt(0) == "-")
               onChange(e.target.value.replace("+", "").replace("-", ""));
         }
      };

      value *= shift;
      min *= shift;
      max *= shift;
   }

   const _onChange = (e) => {
      if (!isNaN(e.target.value) && e.target.value >= min && e.target.value <= max) {
         if (float)
            onChange(Math.round(e.target.value) / shift);
         else
            onChange(Math.round(e.target.value));
      }
   };

   return (
      <div className={"optionbar-input-container" + (className ? " " + className : "")}>
         {
            label &&
            <span className="optionbar-input-label">{label + ":"}</span>
         }
         <input className="optionbar-input-slider" type="range" value={value} onChange={_onChange} min={min} max={max} style={{width: sliderWidth}}/>
         {
            input &&
            <input className="optionbar-input" type="text" value={float ? unshifted.value : value} onChange={float ? unshifted.onChange : _onChange} style={{width: inputWidth}}/>
         }
      </div>
   )
}

export default OptionbarInputSlider;