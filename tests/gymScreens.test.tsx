import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import Detail from "../frontend/app/gym/[id]";
import Gyms from "../frontend/app/(tabs)/index";
import { renderApp, makeStore } from "./helpers/renderApp";
import {
  gymsReceived,
  gymsFailed,
  reportsReceived,
  reportsFailed,
} from "../frontend/src/store/slices/gymSlice";
import { photoUrl } from "../backend/services/reportService";
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "campus" }),
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));
jest.mock("../backend/services/reportService", () => ({ photoUrl: jest.fn() }));
jest.setTimeout(15000);
const gym = {
  id: "campus",
  name: "Gimnasio Campus",
  address: "Dirección de prueba",
};
test("detalle espera el catálogo sin afirmar que el gimnasio no existe", async () => {
  await renderApp(<Detail />);
  expect(screen.getByLabelText("Cargando")).toBeTruthy();
  expect(screen.queryByText("Gimnasio no disponible")).toBeNull();
});
test("detalle distingue un gimnasio inexistente tras cargar el catálogo", async () => {
  const store = makeStore();
  store.dispatch(gymsReceived([]));
  await renderApp(<Detail />, store);
  expect(screen.getByText("Gimnasio no disponible")).toBeTruthy();
});
test("historial en carga no afirma que se puede publicar el primer reporte", async () => {
  const store = makeStore();
  store.dispatch(gymsReceived([gym]));
  await renderApp(<Detail />, store);
  expect(screen.getByLabelText("Cargando")).toBeTruthy();
  expect(screen.queryByText(/Puedes publicar el primer/)).toBeNull();
});
test("un error de historial no se presenta como historial vacío", async () => {
  const store = makeStore();
  store.dispatch(gymsReceived([gym]));
  store.dispatch(reportsFailed({ id: "campus", error: "No hay conexión" }));
  await renderApp(<Detail />, store);
  expect(screen.getByRole("alert")).toHaveTextContent("No hay conexión");
  expect(screen.queryByText(/Puedes publicar el primer/)).toBeNull();
});
test("historial vacío confirmado informa ausencia de reportes", async () => {
  const store = makeStore();
  store.dispatch(gymsReceived([gym]));
  store.dispatch(reportsReceived({ id: "campus", reports: [] }));
  await renderApp(<Detail />, store);
  expect(screen.getByText(/Puedes publicar el primer/)).toBeTruthy();
  expect(screen.getByText("No hay reportes registrados.")).toBeTruthy();
});
test("el detalle presenta el último reporte, foto e historial y marca datos antiguos", async () => {
  jest.mocked(photoUrl).mockResolvedValue("https://example.test/foto.jpg");
  const store = makeStore();
  store.dispatch(gymsReceived([gym]));
  const old = {
    id: "anterior",
    gymId: "campus",
    userId: "u",
    level: "empty" as const,
    photoPath: "u/anterior.jpg",
    createdAt: Date.now() - 7200000,
  };
  store.dispatch(
    reportsReceived({
      id: "campus",
      reports: [
        { ...old, id: "ultimo", level: "full", photoPath: "u/ultimo.jpg" },
        old,
      ],
    }),
  );
  await renderApp(<Detail />, store);
  expect(screen.getByText("● Lleno · Desactualizado")).toBeTruthy();
  expect(
    await screen.findByLabelText(
      "Fotografía del último reporte de Gimnasio Campus",
    ),
  ).toBeTruthy();
  expect(screen.getByText("○ Vacío")).toBeTruthy();
});
test("búsqueda y navegación funcionan con datos de Redux", async () => {
  const store = makeStore();
  store.dispatch(
    gymsReceived([
      gym,
      { id: "otro", name: "Otro gimnasio", address: "Otra dirección" },
    ]),
  );
  await renderApp(<Gyms />, store);
  await fireEvent.changeText(
    screen.getByLabelText("Buscar gimnasio"),
    "CAMPUS",
  );
  expect(
    screen.queryByRole("button", { name: "Ver Otro gimnasio" }),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Ver Gimnasio Campus" }),
  );
  expect(mockPush).toHaveBeenCalledWith({
    pathname: "/gym/[id]",
    params: { id: "campus" },
  });
});
test("lista vacía y error de conexión se muestran sin cerrar la pantalla", async () => {
  const store = makeStore();
  store.dispatch(gymsFailed("No hay conexión"));
  await renderApp(<Gyms />, store);
  expect(screen.getByRole("alert")).toHaveTextContent("No hay conexión");
  expect(screen.getByLabelText("Buscar gimnasio")).toBeTruthy();
});
test("un catálogo vacío confirmado no inventa gimnasios ni estados", async () => {
  const store = makeStore();
  store.dispatch(gymsReceived([]));
  await renderApp(<Gyms />, store);
  expect(screen.getByText(/No hay gimnasios disponibles/)).toBeTruthy();
  expect(screen.queryByText(/Lleno|Vacío|Medio/)).toBeNull();
});
