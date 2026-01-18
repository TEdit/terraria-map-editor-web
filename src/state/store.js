import { createStore } from "redux";

import appReducer from "./state.js";

const store = createStore(appReducer);

export default store;