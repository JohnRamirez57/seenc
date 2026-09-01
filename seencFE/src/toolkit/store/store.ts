// store.ts

import { configureStore } from "@reduxjs/toolkit";
import mediaReducer from "../slices/mediaSlice.ts";
import authReducer from "../slices/authSlice.ts";

export const store = configureStore({
  reducer: {
    media: mediaReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;