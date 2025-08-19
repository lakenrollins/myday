import { configureStore } from "@reduxjs/toolkit";
import logger from "redux-logger";
import sessionReducer from "./session";
import pinsReducer from "./pins";

const store = configureStore({
  reducer: {
    session: sessionReducer,
    pins: pinsReducer,
  },
  middleware: (getDefaultMiddleware) => 
    import.meta.env.MODE !== "production"
      ? getDefaultMiddleware().concat(logger)
      : getDefaultMiddleware(),
  devTools: import.meta.env.MODE !== "production",
});

export default store;
