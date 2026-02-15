import React from "react";
import { connect } from "react-redux";
import { stateChange } from "../state/state.js";
import menu from "../app/menu.js";

import AppbarButton from "./appbar/button.jsx"
import { MenuIcon, PropertiesIcon, ToolOptionsIcon } from "./icon.jsx";
import "./styles/appbar.css";

function Appbar({ stateChange, running }) {
   const onClickMenu = () => {
      stateChange(["appbar", "drawer"], "menu");
   }

   const onClickProperties = () => {
      stateChange(["appbar", "drawer"], "sidebar");
   }

   const onClickToolOptions = () => {
      stateChange(["appbar", "drawer"], "optionbar");
   }

   return (
      <div className="appbar-container">
         <div className="appbar">
            <AppbarButton Icon={MenuIcon} onClick={onClickMenu}/>
            <div style={{ display: 'flex' }}>
               {
                  running &&
                  <AppbarButton Icon={ToolOptionsIcon} onClick={onClickToolOptions}/>
               }
               {
                  running &&
                  <AppbarButton Icon={PropertiesIcon} onClick={onClickProperties}/>
               }
            </div>
         </div>
      </div>
   );
}

export default connect(state => {
      return {
         running: state.canvas.running,
      };
   },
   { stateChange }
)(Appbar);
