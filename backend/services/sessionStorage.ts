import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { randomUUID } from "expo-crypto";

type Manifest = { version: 1; generation: string; count: number };
const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const root = (key: string) => `fitcrew.auth.${key}`;
const partKey = (key: string, manifest: Manifest, index: number) =>
  `${root(key)}.${manifest.generation}.${index}`;
async function manifestFor(key: string): Promise<Manifest | null> {
  const raw = await SecureStore.getItemAsync(root(key));
  if (raw === null) return null;
  let value: Manifest | null = null;
  try {
    value = JSON.parse(raw);
  } catch {
    // Se descarta abajo junto con cualquier copia antigua.
  }
  if (
    !value ||
    value.version !== 1 ||
    typeof value.generation !== "string" ||
    !/^[a-zA-Z0-9-]+$/.test(value.generation) ||
    !Number.isInteger(value.count) ||
    value.count < 1 ||
    value.count > 128
  ) {
    // Corrupción no es un fallo del Keystore: descartar la referencia inválida
    // y el legacy para permitir un acceso nuevo sin resucitar tokens antiguos.
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(root(key));
    return null;
  }
  return value;
}
async function discard(key: string, manifest: Manifest) {
  await Promise.all(
    Array.from({ length: manifest.count }, (_, i) =>
      SecureStore.deleteItemAsync(partKey(key, manifest, i)),
    ),
  );
}

// El SDK serializa operaciones Auth con processLock. Cada generación se publica
// sólo al completar todos sus fragmentos cifrados: una renovación fallida conserva
// la anterior. 400 puntos Unicode <= 1600 bytes por entrada, incluso con emoji.
export const sessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const manifest = await manifestFor(key);
    if (manifest) {
      const chunks = await Promise.all(
        Array.from({ length: manifest.count }, (_, i) =>
          SecureStore.getItemAsync(partKey(key, manifest, i)),
        ),
      );
      if (chunks.some((value) => value === null)) {
        await sessionStorage.removeItem(key);
        return null;
      }
      // Reintenta borrar legacy si una ejecución previa se interrumpió después
      // de confirmar el almacenamiento seguro. Nunca restaura legacy sobre éste.
      await AsyncStorage.removeItem(key);
      return chunks.join("");
    }
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) await sessionStorage.setItem(key, legacy);
    return legacy;
  },
  async setItem(key: string, value: string): Promise<void> {
    const characters = Array.from(value);
    const count = Math.max(1, Math.ceil(characters.length / 400));
    if (count > 128) throw new Error("La sesión excede el tamaño permitido.");
    const previous = await manifestFor(key);
    const manifest: Manifest = { version: 1, generation: randomUUID(), count };
    try {
      for (let i = 0; i < count; i++)
        await SecureStore.setItemAsync(
          partKey(key, manifest, i),
          characters.slice(i * 400, (i + 1) * 400).join(""),
          options,
        );
      await SecureStore.setItemAsync(
        root(key),
        JSON.stringify(manifest),
        options,
      );
    } catch (error) {
      await discard(key, manifest).catch(() => undefined);
      throw error;
    }
    // Primero confirmar seguro, después retirar texto plano. Si falla el borrado,
    // se propaga y se reintenta al leer; no se vuelve a escribir texto plano.
    await AsyncStorage.removeItem(key);
    if (previous) await discard(key, previous).catch(() => undefined);
  },
  async removeItem(key: string): Promise<void> {
    const manifest = await manifestFor(key);
    // Evita que el mecanismo de migración resucite una sesión al cerrar sesión.
    await AsyncStorage.removeItem(key);
    if (manifest) {
      await SecureStore.deleteItemAsync(root(key));
      await discard(key, manifest);
    }
  },
};
