import {
  loadPending,
  removePending,
  savePending,
} from "../backend/services/pendingService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { PendingReport } from "../backend/types";
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///documents/",
  copyAsync: jest.fn(),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));
const item: PendingReport = {
  id: "r",
  gymId: "gym",
  userId: "alice",
  photoUri: "file:///cache/photo.jpg",
  level: "empty",
  capturedAt: 1,
};
test("copia la imagen antes de guardar y separa pendientes por cuenta", async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  const saved = await savePending(item);
  expect(FileSystem.copyAsync).toHaveBeenCalledWith({
    from: item.photoUri,
    to: "file:///documents/fitcrew-r.jpg",
  });
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    "fitcrew:pending:alice",
    JSON.stringify([saved]),
  );
  await loadPending("bob");
  expect(AsyncStorage.getItem).toHaveBeenLastCalledWith("fitcrew:pending:bob");
});
test("no admite más de cinco pendientes y conserva los existentes", async () => {
  jest
    .mocked(AsyncStorage.getItem)
    .mockResolvedValue(
      JSON.stringify(
        Array.from({ length: 5 }, (_, i) => ({ ...item, id: String(i) })),
      ),
    );
  await expect(savePending(item)).rejects.toThrow("5 reportes");
  expect(FileSystem.copyAsync).not.toHaveBeenCalled();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});
test("elimina sólo el pendiente indicado y su archivo local", async () => {
  jest
    .mocked(AsyncStorage.getItem)
    .mockResolvedValue(JSON.stringify([item, { ...item, id: "otro" }]));
  await removePending(item);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    "fitcrew:pending:alice",
    JSON.stringify([{ ...item, id: "otro" }]),
  );
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith(item.photoUri, {
    idempotent: true,
  });
});
test("los metadatos guardados se recuperan en otra lectura y no aparecen en otra cuenta", async () => {
  const disk = new Map<string, string>();
  jest
    .mocked(AsyncStorage.getItem)
    .mockImplementation(async (key) => disk.get(key) ?? null);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => {
    disk.set(key, value);
  });
  const saved = await savePending(item);
  expect(await loadPending("alice")).toEqual([saved]);
  expect(await loadPending("bob")).toEqual([]);
  await removePending(saved);
  expect(await loadPending("alice")).toEqual([]);
});
test("un fallo de escritura local no borra los pendientes previos", async () => {
  const previous = { ...item, id: "previo" };
  jest
    .mocked(AsyncStorage.getItem)
    .mockResolvedValue(JSON.stringify([previous]));
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error("No hay espacio"));
  await expect(savePending(item)).rejects.toThrow("No hay espacio");
  expect(await loadPending("alice")).toEqual([previous]);
  expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
});
