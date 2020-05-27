import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { stateChangeModal } from "/state/modules/app.js";

import { CrossIcon } from "/components/icon.jsx";
import "/components/styles/modal.css";
import ModalSignin from "/components/modal/signin.jsx";
import ModalSignup from "/components/modal/signup.jsx";
import ModalAccount from "/components/modal/account.jsx";
import ErrorReport from "/components/modal/errorReport.jsx";
import SuggestionReport from "/components/modal/suggestionReport.jsx";
import SavingDisclaimer from "/components/modal/savingDisclaimer.jsx";

const config = {
   signin: {
      label: "Sign In",
      View: ModalSignin
   },
   signup: {
      label: "Sign Up",
      View: ModalSignup
   },
   account: {
      label: "Account",
      View: ModalAccount
   },
   errorreport: {
      label: "Error report",
      View: ErrorReport
   },
   suggestionreport: {
      label: "Suggestions report",
      View: SuggestionReport
   },
   savingdisclaimer: {
      label: "Please be careful",
      View: SavingDisclaimer
   }
};

const Modal = ({ modalView, stateChangeModal }) => {
   if (modalView === null)
      return "";

   let View;
   if (config[modalView])
      View = config[modalView].View
   else
      return "";

   const onClose = () => {
      stateChangeModal(null);
   }

   const onModalClick = (e) => {
      if (e.target.classList.contains("modal-background"))
         onClose();
   }

   return (
      <div className="modal-background" onClick={onModalClick}>
         <div className="modal-container">
            <div className="modal-header">
               <div className="modal-header-text">{config[modalView].label}</div>
               <button className="modal-button-close" type="button" onClick={onClose}>
                  <CrossIcon size={28}/>
               </button>
            </div>
            <View/>
         </div>
      </div>
   );
}

export default connect(
   state => {
      return {
         modalView: state.app.modal
      };
   },
   { stateChangeModal }
)(Modal);
