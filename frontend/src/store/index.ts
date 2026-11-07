import { configureStore } from "@reduxjs/toolkit";
import auth from "./slices/authSlice";
import gyms from "./slices/gymSlice";
import preferences from "./slices/preferencesSlice";
export const store = configureStore({ reducer: { auth, gyms, preferences } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
