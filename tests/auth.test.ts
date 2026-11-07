import {
  login,
  register,
  logout,
  watchAuth,
} from "../backend/services/authService";
import { errorMessage } from "../backend/utils/validation";
const mockAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn(),
};
jest.mock("../backend/services/supabase", () => ({
  backend: () => ({ auth: mockAuth }),
}));
beforeEach(() => {
  mockAuth.signInWithPassword.mockResolvedValue({ error: null });
  mockAuth.signOut.mockResolvedValue({ error: null });
});
test("inicia sesión con correo normalizado", async () => {
  await login(" crew@example.com ", "abcdef");
  expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
    email: "crew@example.com",
    password: "abcdef",
  });
});
test("propaga credenciales incorrectas y las traduce", async () => {
  mockAuth.signInWithPassword.mockResolvedValueOnce({
    error: { code: "invalid_credentials" },
  });
  await expect(login("crew@example.com", "incorrecta")).rejects.toEqual({
    code: "invalid_credentials",
  });
  expect(errorMessage({ code: "invalid_credentials" })).toBe(
    "Correo o contraseña incorrectos.",
  );
});
test("valida datos antes de llamar a Supabase", async () => {
  await expect(login("inválido", "123456")).rejects.toThrow("correo válido");
  await expect(login("crew@example.com", "123")).rejects.toThrow(
    "6 caracteres",
  );
  await expect(register(" ", "crew@example.com", "123456")).rejects.toThrow(
    "nombre",
  );
  expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
});
test("registra nombre en metadatos y devuelve perfil sólo con sesión", async () => {
  const user = {
    id: "u",
    email: "crew@example.com",
    user_metadata: { name: "Crew" },
  };
  mockAuth.signUp.mockResolvedValueOnce({
    data: { session: { user } },
    error: null,
  });
  await expect(
    register(" Crew ", "crew@example.com", "123456"),
  ).resolves.toEqual({ uid: "u", email: "crew@example.com", name: "Crew" });
  expect(mockAuth.signUp).toHaveBeenCalledWith({
    email: "crew@example.com",
    password: "123456",
    options: { data: { name: "Crew" } },
  });
});
test("registro con confirmación de correo no inventa una sesión", async () => {
  mockAuth.signUp.mockResolvedValueOnce({
    data: { session: null, user: { id: "u" } },
    error: null,
  });
  await expect(
    register("Crew", "crew@example.com", "123456"),
  ).resolves.toBeNull();
  expect(errorMessage({ code: "email_not_confirmed" })).toContain(
    "Confirma tu correo",
  );
});
test("cierre de sesión es local y propaga fallos", async () => {
  await logout();
  expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: "local" });
  mockAuth.signOut.mockResolvedValueOnce({ error: { code: "network_error" } });
  await expect(logout()).rejects.toEqual({ code: "network_error" });
});
test("la restauración inicial no sobrescribe un evento de sesión más reciente", async () => {
  let finish!: (result: unknown) => void;
  const unsubscribe = jest.fn();
  let event!: (event: string, session: unknown) => void;
  mockAuth.getSession.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  mockAuth.onAuthStateChange.mockImplementationOnce((callback) => {
    event = callback;
    return { data: { subscription: { unsubscribe } } };
  });
  const next = jest.fn();
  const fail = jest.fn();
  const stop = watchAuth(next, fail);
  event("SIGNED_IN", {
    user: {
      id: "new",
      email: "a@example.com",
      user_metadata: { name: "Actual" },
    },
  });
  finish({ data: { session: null }, error: null });
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith({
    uid: "new",
    email: "a@example.com",
    name: "Actual",
  });
  stop();
  expect(unsubscribe).toHaveBeenCalled();
  expect(fail).not.toHaveBeenCalled();
});
