import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { sessionStorage } from "../backend/services/sessionStorage";
import { randomUUID } from "expo-crypto";
import { createClient } from "@supabase/supabase-js";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
}));
jest.mock("expo-crypto", () => ({ randomUUID: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));
let disk: Map<string, string>;
let legacy: Map<string, string>;
let generation: number;
beforeEach(() => {
  disk = new Map();
  legacy = new Map();
  generation = 0;
  jest
    .mocked(randomUUID)
    .mockImplementation(() => `generation-${++generation}`);
  jest
    .mocked(SecureStore.getItemAsync)
    .mockImplementation(async (k) => disk.get(k) ?? null);
  jest.mocked(SecureStore.setItemAsync).mockImplementation(async (k, v) => {
    disk.set(k, v);
  });
  jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (k) => {
    disk.delete(k);
  });
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async (k) => legacy.get(k) ?? null);
  jest.mocked(AsyncStorage.removeItem).mockImplementation(async (k) => {
    legacy.delete(k);
  });
});
const key = "sb-project-auth-token";
test("sesión grande y Unicode se restaura sin texto plano ni entradas mayores de 2 KiB", async () => {
  const session = JSON.stringify({
    access_token: "a".repeat(5000),
    name: "🙂á".repeat(800),
  });
  await sessionStorage.setItem(key, session);
  await expect(sessionStorage.getItem(key)).resolves.toBe(session);
  for (const value of disk.values())
    expect(new TextEncoder().encode(value).length).toBeLessThan(2048);
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
test("migra sesión anterior sólo después de guardarla cifrada", async () => {
  legacy.set(key, "sesión-anterior");
  await expect(sessionStorage.getItem(key)).resolves.toBe("sesión-anterior");
  expect(legacy.has(key)).toBe(false);
  expect(disk.size).toBeGreaterThan(0);
});
test("fallo nativo durante migración conserva original y propaga error, sin fallback", async () => {
  legacy.set(key, "original");
  jest
    .mocked(SecureStore.setItemAsync)
    .mockRejectedValueOnce(new Error("locked"));
  await expect(sessionStorage.getItem(key)).rejects.toThrow("locked");
  expect(legacy.get(key)).toBe("original");
  expect(disk.size).toBe(0);
});
test("renovación fallida conserva sesión anterior y limpia fragmentos incompletos", async () => {
  await sessionStorage.setItem(key, "anterior");
  const before = new Map(disk);
  jest
    .mocked(SecureStore.setItemAsync)
    .mockImplementationOnce(async (k, v) => {
      disk.set(k, v);
    })
    .mockRejectedValueOnce(new Error("disk-full"));
  await expect(sessionStorage.setItem(key, "x".repeat(1000))).rejects.toThrow(
    "disk-full",
  );
  expect(disk).toEqual(before);
  await expect(sessionStorage.getItem(key)).resolves.toBe("anterior");
});
test("renovación confirmada elimina la generación anterior", async () => {
  await sessionStorage.setItem(key, "vieja");
  await sessionStorage.setItem(key, "nueva");
  await expect(sessionStorage.getItem(key)).resolves.toBe("nueva");
  expect([...disk.keys()].some((k) => k.includes("generation-1"))).toBe(false);
});
test("cierre elimina sesión segura y legacy; no reaparece al leer de nuevo", async () => {
  await sessionStorage.setItem(key, "actual");
  legacy.set(key, "obsoleta");
  await sessionStorage.removeItem(key);
  expect(disk.size).toBe(0);
  await expect(sessionStorage.getItem(key)).resolves.toBeNull();
});
test("fragmento perdido o manifiesto inválido no restaura una sesión parcial o legacy", async () => {
  await sessionStorage.setItem(key, "actual");
  legacy.set(key, "obsoleta");
  const part = [...disk.keys()].find((k) => k.includes("generation-"))!;
  disk.delete(part);
  await expect(sessionStorage.getItem(key)).resolves.toBeNull();
  expect(legacy.has(key)).toBe(false);
});

test("manifiesto corrupto permite volver a iniciar sesión sin rescatar legacy", async () => {
  disk.set(`fitcrew.auth.${key}`, "{invalid");
  legacy.set(key, "obsoleta");
  await expect(sessionStorage.getItem(key)).resolves.toBeNull();
  await sessionStorage.setItem(key, "nueva");
  await expect(sessionStorage.getItem(key)).resolves.toBe("nueva");
});

test("fallo al borrar legacy después del commit se reintenta sin perder sesión segura", async () => {
  legacy.set(key, "original");
  jest
    .mocked(AsyncStorage.removeItem)
    .mockRejectedValueOnce(new Error("locked"));
  await expect(sessionStorage.getItem(key)).rejects.toThrow("locked");
  await expect(sessionStorage.getItem(key)).resolves.toBe("original");
  expect(legacy.has(key)).toBe(false);
});

test("SDK Supabase real: acceso, restauración, renovación y salida con almacenamiento protegido", async () => {
  const user = {
    id: "u-test",
    aud: "authenticated",
    email: "test@example.invalid",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const token = (tag: string) =>
    `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, tag })).toString("base64url")}.signature`;
  let count = 0;
  const fetchMock = jest.fn(async (url: string) => {
    if (url.includes("/logout")) return new Response(null, { status: 204 });
    count++;
    return new Response(
      JSON.stringify({
        access_token: token(String(count)),
        refresh_token: `refresh-${count}`,
        token_type: "bearer",
        expires_in: 3600,
        user,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  const makeClient = () =>
    createClient("https://example.invalid", "test-public-key", {
      auth: {
        storage: sessionStorage,
        storageKey: key,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: fetchMock as unknown as typeof fetch },
    });
  const first = makeClient();
  const result = await first.auth.signInWithPassword({
    email: user.email,
    password: "test-only",
  });
  expect(result.error).toBeNull();
  expect(legacy.size).toBe(0);
  const second = makeClient();
  expect((await second.auth.getSession()).data.session?.user.id).toBe(user.id);
  const refreshed = await second.auth.refreshSession();
  expect(refreshed.error).toBeNull();
  expect(refreshed.data.session?.refresh_token).toBe("refresh-2");
  await second.auth.signOut({ scope: "local" });
  expect((await second.auth.getSession()).data.session).toBeNull();
  expect(disk.size).toBe(0);
  await first.auth.stopAutoRefresh();
  await second.auth.stopAutoRefresh();
});
