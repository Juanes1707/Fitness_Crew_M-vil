import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configureStore } from "@reduxjs/toolkit";
import { AuthForm } from "../frontend/src/components/AuthForm";
import { Button, Occupancy } from "../frontend/src/components/ui";
import { login, register } from "../backend/services/authService";
import preferences from "../frontend/src/store/slices/preferencesSlice";
import { StyleSheet } from "react-native";
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../backend/services/authService", () => ({
  login: jest.fn(),
  register: jest.fn(),
}));
// El primer render de los mocks nativos 0.88 tarda más de 5 s en este Windows.
jest.setTimeout(15000);
async function wrap(child: React.ReactNode) {
  const store = configureStore({ reducer: { preferences } });
  return await render(
    <Provider store={store}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        {child}
      </SafeAreaProvider>
    </Provider>,
  );
}
test("formulario tiene etiquetas y anuncia errores sin llamar al backend", async () => {
  await wrap(<AuthForm />);
  expect(screen.getByLabelText("Correo electrónico")).toBeTruthy();
  expect(screen.getByLabelText("Contraseña")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Iniciar sesión" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Escribe un correo válido.",
  );
  expect(login).not.toHaveBeenCalled();
});
test("estado ocupado deshabilita la acción y expone el estado accesible", async () => {
  const press = jest.fn();
  await wrap(<Button title="Publicar" busy onPress={press} />);
  const button = screen.getByRole("button", { name: "Publicar" });
  expect(button).toBeDisabled();
  expect(button.props.accessibilityState.busy).toBe(true);
  await fireEvent.press(button);
  expect(press).not.toHaveBeenCalled();
});
test("ocupación usa texto e icono y anuncia datos vencidos", async () => {
  await wrap(<Occupancy level="full" stale />);
  expect(screen.getByText("● Lleno · Desactualizado")).toBeTruthy();
});
test("el registro que requiere confirmar correo muestra instrucciones", async () => {
  jest.mocked(register).mockResolvedValueOnce(null);
  await wrap(<AuthForm registration />);
  await fireEvent.changeText(screen.getByLabelText("Nombre"), "Crew");
  await fireEvent.changeText(
    screen.getByLabelText("Correo electrónico"),
    "crew@example.com",
  );
  await fireEvent.changeText(screen.getByLabelText("Contraseña"), "123456");
  await fireEvent.press(screen.getByRole("button", { name: "Crear cuenta" }));
  expect(
    await screen.findByText(
      "Revisa tu correo para confirmar la cuenta. Después vuelve e inicia sesión.",
    ),
  ).toBeTruthy();
});
test("los botones cumplen el mínimo táctil de Android en ambos ejes", async () => {
  await wrap(<Button title="X" onPress={() => undefined} />);
  const style = StyleSheet.flatten(
    screen.getByRole("button", { name: "X" }).props.style,
  );
  expect(style.minHeight).toBeGreaterThanOrEqual(48);
  expect(style.minWidth).toBeGreaterThanOrEqual(48);
});
