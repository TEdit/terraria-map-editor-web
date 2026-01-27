/**
 * Centralized worker messaging manager
 * Handles message ID generation, correlation, and concurrent operations
 *
 * Fixes race condition where multiple worker calls would overwrite
 * each other's onmessage handlers
 */

class WorkerMessaging {
    constructor() {
        this.messageIdCounter = 0;
        this.pendingRequests = new Map();
        this.worker = null;
        this.defaultTimeout = 30000; // 30 seconds
    }

    /**
     * Initialize with worker instance
     * Sets up central onmessage handler for all worker responses
     */
    init(worker) {
        this.worker = worker;
        this.worker.onmessage = this.handleMessage.bind(this);
    }

    /**
     * Generate unique message ID
     * Uses simple incrementing counter (thread-safe in single-threaded JS)
     */
    generateMessageId() {
        return ++this.messageIdCounter;
    }

    /**
     * Send message to worker and await response
     *
     * @param {string} action - Worker action type (e.g., "EDIT_TILES")
     * @param {object} data - Data to send to worker
     * @param {object} options - Optional configuration
     * @param {number} options.timeout - Timeout in milliseconds (default 30s)
     * @param {object} options.callbacks - Optional callbacks for intermediate messages
     * @returns {Promise} Resolves with response data
     */
    sendMessage(action, data, options = {}) {
        const { timeout = this.defaultTimeout, callbacks = {} } = options;

        return new Promise((resolve, reject) => {
            const messageId = this.generateMessageId();

            // Set up timeout handler
            const timeoutId = setTimeout(() => {
                this.pendingRequests.delete(messageId);
                reject(new Error(`Worker timeout for ${action} (ID: ${messageId})`));
            }, timeout);

            // Store pending request with resolve/reject handlers and callbacks
            this.pendingRequests.set(messageId, {
                resolve,
                reject,
                timeoutId,
                action,
                callbacks
            });

            // Send message to worker with messageId for correlation
            this.worker.postMessage({
                ...data,
                action,
                messageId
            });
        });
    }

    /**
     * Handle incoming messages from worker
     * Correlates responses with pending requests using messageId
     * Routes intermediate messages to callbacks
     */
    handleMessage({ data }) {
        const { messageId, action } = data;

        // Handle error messages
        if (action === "ERROR") {
            if (messageId && this.pendingRequests.has(messageId)) {
                const request = this.pendingRequests.get(messageId);
                clearTimeout(request.timeoutId);
                this.pendingRequests.delete(messageId);
                request.reject(data.error);
            } else {
                // Global error without messageId (shouldn't happen with new system)
                console.error("Worker error (no messageId):", data.error);
            }
            return;
        }

        // Check if this is for a pending request
        if (messageId && this.pendingRequests.has(messageId)) {
            const request = this.pendingRequests.get(messageId);

            // Define which actions are final (resolve the promise)
            const finalActions = [
                "RETURN_EDIT_TILES",
                "RETURN_DONE",
                "RETURN_WORLD_OBJECT",
                "RETURN_LAYERS_IMAGES",
                "RETURN_NEW_WORLD_FILE",
                "RETURN_TILE_DATA"
            ];

            // Check if this is a final response or intermediate callback
            if (finalActions.includes(action)) {
                // Final response - resolve promise
                clearTimeout(request.timeoutId);
                this.pendingRequests.delete(messageId);

                // Resolve with response data (strip action/messageId metadata)
                const { action: _, messageId: __, ...responseData } = data;
                request.resolve(responseData);
            } else {
                // Intermediate message - route to appropriate callback
                const callbacks = request.callbacks || {};

                switch(action) {
                    case "RETURN_PROGRESS":
                        callbacks.onProgress?.(data.percent);
                        break;
                    case "RETURN_PARSING_PERCENT_INCOMING":
                        callbacks.onParseStart?.();
                        break;
                    case "RETURN_PARSING_PERCENT":
                        callbacks.onParseProgress?.(data.percent);
                        break;
                    case "RETURN_RENDERING_PERCENT_INCOMING":
                        callbacks.onRenderingStart?.();
                        break;
                    case "RETURN_RENDERING_PERCENT":
                        callbacks.onRenderingProgress?.(data.percent);
                        break;
                    case "RETURN_LAYERS_IMAGES_INCOMING":
                        callbacks.onRenderingDone?.();
                        break;
                    case "RETURN_SAVING_PERCENT_INCOMING":
                        callbacks.onSaveStart?.();
                        break;
                    case "RETURN_SAVING_PERCENT":
                        callbacks.onSaveProgress?.(data.percent);
                        break;
                    default:
                        console.warn("Unhandled intermediate message:", action);
                }
            }
        } else {
            // Response without pending request (legacy message or already resolved)
            console.warn("Received worker message without pending request:", action, messageId);
        }
    }

    /**
     * Reset worker messaging state
     * Rejects all pending requests and clears state
     * Called when worker is terminated/recreated
     */
    reset() {
        // Reject all pending requests with reset error
        this.pendingRequests.forEach(request => {
            clearTimeout(request.timeoutId);
            request.reject(new Error("Worker reset"));
        });

        // Clear state
        this.pendingRequests.clear();
        this.messageIdCounter = 0;
    }
}

// Export singleton instance
export default new WorkerMessaging();
