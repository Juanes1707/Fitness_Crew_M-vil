import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "../../../../backend/types/index";
const authSlice = createSlice({
  name: "auth",
  initialState: { user: null as UserProfile | null, ready: false },
  reducers: {
    sessionChanged(state, action: PayloadAction<UserProfile | null>) {
      state.user = action.payload;
      state.ready = true;
    },
  },
});
export const { sessionChanged } = authSlice.actions;
export default authSlice.reducer;
