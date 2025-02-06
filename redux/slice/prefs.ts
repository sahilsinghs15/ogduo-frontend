import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Prefs {
  mode: 'system' | 'dark' | 'light';
}

const initialState: Prefs = {
  mode: 'system', // or whatever your default mode should be
  // ... other preferences
};

export const prefsSlice = createSlice({
  name: 'prefs',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<'system' | 'dark' | 'light'>) => {
      state.mode = action.payload;
    },
  }
});

export const { setMode } = prefsSlice.actions;
export default prefsSlice.reducer; 