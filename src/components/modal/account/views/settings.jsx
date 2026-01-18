import React from "react";
import { connect } from "react-redux";
import { stateChange } from "../../../../state/state.js";

import Button from "../button.jsx";

function ModalAccountViewSettings({ close, stateChange }) {
   const onLogOut = () => {
      stateChange("user", null);
      close()
   }

   return (
      <div className="modal-account-view-settings">
         <Button label={"Log Out"} onClick={onLogOut} primary/>
      </div>
   );
}

export default connect(
   null,
   { stateChange }
)(ModalAccountViewSettings);
