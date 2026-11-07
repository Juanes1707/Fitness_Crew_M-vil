import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type ThemeMode = "system" | "light" | "dark";
const slice = createSlice({
  name: "preferences",
  initialState: { theme: "system" as ThemeMode },
  reducers: {
    themeChanged(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
  },
});
export const { themeChanged } = slice.actions;
export default slice.reducer;
