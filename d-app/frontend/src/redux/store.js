import { configureStore } from "@reduxjs/toolkit";
import statsReducer from "./slices/statsSlice";

export const store = configureStore({
  reducer: {
    stats: statsReducer,
  },
});
