//css
import "normalize.css";
import "./main.css";

//polyfills
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr) {
        if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]')
            return this.replace(str, newStr);
        return this.replace(new RegExp(str, 'g'), newStr);
    };
}

//react
import React from "react";
import { createRoot } from "react-dom/client";

import { Provider } from "react-redux";
import store from "./state/store.js";

import Controller from "./components/__controller.jsx";
import Editor from "./pages/Editor.jsx";

const root = createRoot(document.querySelector("#app"));
root.render(
    <Provider store={store}>
        <Controller/>
        <Editor/>
    </Provider>
);

// Register Service Worker for PWA offline support (production only)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.warn('Service Worker registration failed:', error);
            });
    });
}
