/*import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'*/

import { messages } from "../modules/ams/src";

import { Reducers } from "../modules/ams/src";

import { configureStore } from "@reduxjs/toolkit";

// const reducer = combineReducers({
//   ...Reducers,
//   messages
// });

// export default createStore(reducer, applyMiddleware(thunk))
export default configureStore({
  reducer: {
    ...Reducers,
    messages
  },
});
