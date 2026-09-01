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
    addToSavedMedia: (state, action: PayloadAction<savedEntry>) => {
      state.savedMedia = [...state.savedMedia, action.payload];
    },

    removeFromSavedMedia: (state, action: PayloadAction<savedEntry>) => {
        state.savedMedia = [...state.savedMedia, action.payload];
    },

    updateSearchedMedia: (state, action: PayloadAction<movieOrTvResult[]>) => {
        state.searchedMedia = action.payload;
    }
  }
});

export const { addToSavedMedia, removeFromSavedMedia, updateSearchedMedia } = mediaSlice.actions;

export default mediaSlice.reducer;