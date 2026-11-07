import React, { ReactElement, ReactNode } from "react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { render } from "@testing-library/react-native";
import auth from "../../frontend/src/store/slices/authSlice";
import gyms from "../../frontend/src/store/slices/gymSlice";
import preferences from "../../frontend/src/store/slices/preferencesSlice";
export function makeStore() {
  return configureStore({ reducer: { auth, gyms, preferences } });
}
export async function renderApp(element: ReactElement, store = makeStore()) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        {children}
      </SafeAreaProvider>
    </Provider>
  );
  return { ...(await render(element, { wrapper: Wrapper })), store };
}
