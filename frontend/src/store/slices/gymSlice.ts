import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Gym, Report } from "../../../../backend/types/index";
const gymSlice = createSlice({
  name: "gyms",
  initialState: {
    items: [] as Gym[],
    reports: {} as Record<string, Report[]>,
    errors: {} as Record<string, string>,
    loading: true,
    error: "",
  },
  reducers: {
    gymsReceived(state, action: PayloadAction<Gym[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = "";
    },
    reportsReceived(
      state,
      action: PayloadAction<{ id: string; reports: Report[] }>,
    ) {
      state.reports[action.payload.id] = action.payload.reports;
      delete state.errors[action.payload.id];
    },
    reportsFailed(state, action: PayloadAction<{ id: string; error: string }>) {
      state.errors[action.payload.id] = action.payload.error;
    },
    gymsFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    gymsReset() {
      return { items: [], reports: {}, errors: {}, loading: true, error: "" };
    },
  },
});
export const {
  gymsReceived,
  reportsReceived,
  reportsFailed,
  gymsFailed,
  gymsReset,
} = gymSlice.actions;
export default gymSlice.reducer;
