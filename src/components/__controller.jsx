/*
    general namespace and controller for anything
*/

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { stateChange } from "../state/state.js";

import Main from "../canvas/main.js";

function Controller(props) {
   //page load
   useEffect(() => {
      function setHtmlFontSize() {
         document.getElementsByTagName("html")[0].style.fontSize = props.htmlFontSize + "%";
      }

      setHtmlFontSize();
   }, []);

   //resize listener
   useEffect(() => {
      window.onresize = () => {
         if (!props.mobile && window.innerWidth <= 960)
            props.stateChange("mobile", true);
         else if (props.mobile && window.innerWidth > 960)
            props.stateChange("mobile", false);
      };
      window.onresize();
   }, [props.mobile]);

   //canvas
   useEffect(() => {
      Main.state = {
         canvas: props.canvas,
         toolbar: props.toolbar,
         optionbar: props.optionbar,
         layersVisibility: props.layersVisibility,
         selection: props.selection
      };
   });

   useEffect(() => {
      console.log(props.worldFile);
      if (props.worldFile === undefined)
         return; //state initialization

      if (props.worldFile === null)
         Main.extensions.closeMap();
      else
         Main.extensions.loadMap();
   }, [props.worldFile]);

   return null;
}

export default connect(
   state => {
      return {
         canvas: state.canvas,
         toolbar: state.toolbar,
         optionbar: state.optionbar,
         layersVisibility: state.layersVisibility,
         selection: state.selection,
         worldFile: state.canvas.worldFile,
         mobile: state.mobile,
         htmlFontSize: state.htmlFontSize
      };
   },
   { stateChange }
)(Controller);
