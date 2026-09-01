// store.ts

import { configureStore } from "@reduxjs/toolkit";
import mediaReducer from "../slices/mediaSlice.ts";
import authReducer from "../slices/authSlice.ts";
import type { mediaActions } from "../slices/mediaSlice.ts";
import type { authActions } from "../slices/authSlice.ts";

const reducers = {
  media: mediaReducer,
  auth: authReducer
}

interface actions {
  media: mediaActions,
  auth: authActions
}

export const store = configureStore({
  reducer: reducers,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type SliceActions = actions;
// export type reducerOptions = (typeof reducers)[keyof typeof reducers];