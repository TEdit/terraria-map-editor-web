import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { stateChange } from "../state/state.js";
import localSettings from "../utils/localSettings.js";

import LAYERS from "../utils/dbs/LAYERS.js";

import AppbarButton from "./appbar/button.jsx";
import { CrossIcon } from "./icon.jsx";
import OptionbarOptionLayer from "./optionbar/layer.jsx";
import OptionbarOptionSize from "./optionbar/size.jsx";
import OptionbarOptionWorldPoint from "./optionbar/worldPoint.jsx";
import OptionbarOptionTileEditOptions from "./optionbar/tileEditOptions.jsx";

import "./styles/optionbar.css";

import toolsConfig from "../app/tools.js";

function Optionbar({ stateChange, show, running, selectedTool, optionbarState, drawer, mobile }) {
   const ToolIcon = toolsConfig[selectedTool].icon;

   const setState = (newState) => {
      stateChange("optionbar", newState);
      localSettings.set("optionbarState", newState);
   }

   const onMobileCloseClick = () => {
      stateChange(["appbar", "drawer"], null);
   }

   return (
      show &&
      <div className={"optionbar-container" + (drawer == "optionbar" ? " drawer" : "")}>
         {
            mobile &&
            <div className="optionbar-mobile-header">
               <span className="optionbar-mobile-title">Tool Options</span>
               <AppbarButton Icon={CrossIcon} onClick={onMobileCloseClick}/>
            </div>
         }
         <div className="optionbar">
            <div className={"optionbar-icon" + (toolsConfig[selectedTool].stroke ? " optionbar-icon--stroke" : "")}>
               <ToolIcon size="100%"/>
            </div>
            <div className="optionbar-divider"></div>
            {
               running && (selectedTool == "pencil" || selectedTool == "eraser" || selectedTool == "bucket") &&
               <>
                  <OptionbarOptionLayer state={optionbarState} setState={setState} addEraserOptions={selectedTool == "eraser" ? true : false}/>
                  <div className="optionbar-divider"></div>
                  {
                     selectedTool != "eraser" &&
                     <OptionbarOptionTileEditOptions state={optionbarState} setState={setState} tool={selectedTool}/>
                  }
                  {
                     selectedTool == "eraser" &&
                     <OptionbarOptionSize state={optionbarState} setState={setState}/>
                  }
               </>
            }
            {
               running && selectedTool == "picker" &&
               <>
                  <OptionbarOptionLayer state={optionbarState} setState={setState}/>
                  <div className="optionbar-divider"></div>
                  <OptionbarOptionTileEditOptions state={optionbarState} setState={setState} tool={selectedTool}/>
               </>
            }
            {
               running && selectedTool == "worldPoint" &&
               <OptionbarOptionWorldPoint state={optionbarState} setState={setState}/>
            }
         </div>
      </div>
   );
}

export default connect(
   state => {
      return {
         show: state.view.toolbar,
         selectedTool: state.toolbar.tool,
         running: state.canvas.running,
         drawer: state.appbar.drawer,
         mobile: state.mobile,
         optionbarState: {
            layer: state.optionbar.layer,
            size: state.optionbar.size,
            id: state.optionbar.id,
            ordered: state.optionbar.ordered,
            locked: state.optionbar.locked,
            worldPoint: state.optionbar.worldPoint,
            radius: state.optionbar.radius,
            tileEditOptions: state.optionbar.tileEditOptions,
         }
      };
   },
   { stateChange }
)(Optionbar);
