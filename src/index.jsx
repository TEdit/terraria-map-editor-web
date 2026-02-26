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
    let refreshing = false;

    // Reload once when the new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                // Check for updates every 5 minutes
                setInterval(() => registration.update(), 5 * 60 * 1000);

                // Also check for update immediately on visibility change (tab refocus)
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        registration.update();
                    }
                });

                // Handle update flow
                function onNewWorkerReady(worker) {
                    if (confirm('A new version of TEdit is available. Reload to update?')) {
                        worker.postMessage({ type: 'SKIP_WAITING' });
                        // controllerchange listener above will handle the reload
                    }
                }

                // Notify user when a new version is ready
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        // installed = downloaded & ready, but not yet active
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            onNewWorkerReady(newWorker);
                        }
                    });
                });

                // Also handle case where a waiting worker already exists on page load
                if (registration.waiting && navigator.serviceWorker.controller) {
                    onNewWorkerReady(registration.waiting);
                }
            })
            .catch(error => {
                console.warn('Service Worker registration failed:', error);
            });
    });
}
