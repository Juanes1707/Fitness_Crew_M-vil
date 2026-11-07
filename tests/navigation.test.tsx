import {
  renderRouter,
  screen,
  fireEvent,
  testRouter,
} from "expo-router/testing-library";
import Layout from "../frontend/app/_layout";
import Index from "../frontend/app/index";
import Login from "../frontend/app/login";
import Register from "../frontend/app/register";
import TabsLayout from "../frontend/app/(tabs)/_layout";
import Gyms from "../frontend/app/(tabs)/index";
import Profile from "../frontend/app/(tabs)/profile";
import Detail from "../frontend/app/gym/[id]";
import { store } from "../frontend/src/store";
import { sessionChanged } from "../frontend/src/store/slices/authSlice";
import { gymsReset } from "../frontend/src/store/slices/gymSlice";
import { login, logout } from "../backend/services/authService";
import { UserProfile } from "../backend/types";
const mockStopAuth = jest.fn();
const mockStopGyms = jest.fn();
const mockStopReports = jest.fn();
let mockSessionNext: (profile: UserProfile | null) => void;
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../backend/services/supabase", () => ({ supabaseConfigured: true }));
jest.mock("../backend/services/authService", () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  watchAuth: jest.fn((next: (profile: UserProfile | null) => void) => {
    mockSessionNext = next;
    next(null);
    return mockStopAuth;
  }),
}));
jest.mock("../backend/services/gymService", () => ({
  watchGyms: jest.fn((next: (value: unknown) => void) => {
    next([
      { id: "campus", name: "Gimnasio Campus", address: "Dirección de prueba" },
    ]);
    return mockStopGyms;
  }),
  watchReports: jest.fn((_id: string, next: (value: unknown) => void) => {
    next([]);
    return mockStopReports;
  }),
}));
jest.mock("../backend/services/reportService", () => ({ photoUrl: jest.fn() }));
jest.setTimeout(20000);
const originalConsoleError = console.error.bind(console);
const files = {
  _layout: Layout,
  index: Index,
  login: Login,
  register: Register,
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": Gyms,
  "(tabs)/profile": Profile,
  "(tabs)/report": () => null,
  "(tabs)/friends": () => null,
  "gym/[id]": Detail,
};
beforeEach(() => {
  jest
    .spyOn(console, "error")
    .mockImplementation((message: unknown, ...args: unknown[]) => {
      if (String(message).includes("Maximum update depth exceeded"))
        throw new Error("La navegación entró en un bucle de renders.");
      originalConsoleError(message, ...args);
    });
  store.dispatch(sessionChanged(null));
  store.dispatch(gymsReset());
});
afterEach(() => {
  jest.restoreAllMocks();
});
test("un enlace al detalle sin sesión redirige al login", async () => {
  await renderRouter(files, { initialUrl: "/gym/campus" });
  expect(
    await screen.findByRole("button", { name: "Iniciar sesión" }),
  ).toBeTruthy();
  expect(screen.queryByText("Gimnasio Campus")).toBeNull();
  expect(screen).toHavePathname("/login");
});
test("acceso, listado, detalle y cierre de sesión actualizan Redux y las rutas reales", async () => {
  jest.mocked(login).mockImplementationOnce(async () => {
    mockSessionNext({ uid: "u", name: "Crew", email: "crew@example.com" });
  });
  jest.mocked(logout).mockImplementationOnce(async () => {
    mockSessionNext(null);
  });
  await renderRouter(files, { initialUrl: "/login" });
  await fireEvent.changeText(
    screen.getByLabelText("Correo electrónico"),
    "crew@example.com",
  );
  await fireEvent.changeText(screen.getByLabelText("Contraseña"), "123456");
  await fireEvent.press(screen.getByRole("button", { name: "Iniciar sesión" }));
  expect(await screen.findByText("Encuentra tu momento")).toBeTruthy();
  expect(store.getState().auth.user?.uid).toBe("u");
  await fireEvent.press(
    screen.getByRole("button", { name: "Ver Gimnasio Campus" }),
  );
  expect(await screen.findByText("Ocupación reportada")).toBeTruthy();
  expect(screen).toHavePathname("/gym/campus");
  await testRouter.back("/");
  await fireEvent.press(screen.getByText("Perfil"));
  expect(await screen.findByText("crew@example.com")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(
    await screen.findByRole("button", { name: "Iniciar sesión" }),
  ).toBeTruthy();
  expect(store.getState().auth.user).toBeNull();
  expect(store.getState().gyms.items).toEqual([]);
  expect(mockStopGyms).toHaveBeenCalled();
  expect(mockStopReports).toHaveBeenCalled();
});
