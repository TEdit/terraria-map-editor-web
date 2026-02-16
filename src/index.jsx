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

                // Check for updates every 5 minutes
                setInterval(() => registration.update(), 5 * 60 * 1000);

                // Notify user when a new version is ready
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                            // New SW activated while an old one was in control = update available
                            if (confirm('A new version of TEdit is available. Reload to update?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.warn('Service Worker registration failed:', error);
            });
    });

    // If the SW takes control (via clients.claim), reload for consistency
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Only auto-reload if this wasn't the first controller
        if (navigator.serviceWorker.controller) {
            window.location.reload();
        }
    });
}
