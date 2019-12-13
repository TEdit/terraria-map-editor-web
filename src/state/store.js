import { combineReducers, createStore } from "redux";

import menuReducer from "/state/modules/menu.js";
import statusReducer from "/state/modules/status.js";

const rootReducer = combineReducers({
    menu: menuReducer,
    status: statusReducer
});

const store = createStore(rootReducer);

export default store;