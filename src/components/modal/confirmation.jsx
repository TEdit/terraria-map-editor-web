import React from "react";

import ModalAccountButton from "./account/button.jsx";

function ModalConfirmation({ close, text, textButton, onConfirm }) {
   return (
      <div className="modal-sign">
         <span className="modal-sign-text">{text}</span>
         <span className="modal-sign-text"></span>
         <span className="modal-sign-text"></span>
         <ModalAccountButton label={textButton} onClick={() => { close(); onConfirm(); }} primary/>
      </div>
   );
}

export default ModalConfirmation;
