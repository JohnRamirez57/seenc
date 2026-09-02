// authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit"
import type { movieOrTvResult } from "../../interfaces/media.interfaces.ts";
import type { savedEntry } from '../../interfaces/user.interfaces.ts'

interface MediaState {
  savedMedia: savedEntry[],
  searchedMedia: movieOrTvResult[],
}

const initialState: MediaState = {
  savedMedia: [],
  searchedMedia: []
};

const mediaSlice = createSlice({
  name: "media",
  initialState,

  reducers: {
    renewSavedMedia: (state, action: PayloadAction<savedEntry[]>) => {
      state.savedMedia = Array.isArray(action.payload) ? action.payload : [];
    },

    addToSavedMedia: (state, action: PayloadAction<savedEntry>) => {
      state.savedMedia = [...state.savedMedia, action.payload];
    },

    removeFromSavedMedia: (state, action: PayloadAction<savedEntry>) => {
        state.savedMedia = state.savedMedia.filter((entry: savedEntry) => entry.tmdb_id !== action.payload.tmdb_id);
    },

    updateSearchedMedia: (state, action: PayloadAction<movieOrTvResult[]>) => {
        state.searchedMedia = action.payload;
    }
  }
});

export const { addToSavedMedia, removeFromSavedMedia, updateSearchedMedia, renewSavedMedia } = mediaSlice.actions;
export type mediaActions = typeof mediaSlice.actions;
export default mediaSlice.reducer;