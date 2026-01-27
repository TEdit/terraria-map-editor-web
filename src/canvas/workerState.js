// Shared worker state, separated from worker.js to avoid circular dependencies.
// Worker interface files import this instead of worker.js.
const workerState = {
    worldObject: undefined
};

export default workerState;
