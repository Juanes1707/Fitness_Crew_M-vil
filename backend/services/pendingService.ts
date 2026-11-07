import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { PendingReport } from "../types/index";
const key = (uid: string) => `fitcrew:pending:${uid}`;
export async function loadPending(uid: string): Promise<PendingReport[]> {
  return JSON.parse((await AsyncStorage.getItem(key(uid))) ?? "[]");
}
export async function savePending(report: PendingReport) {
  if (!FileSystem.documentDirectory)
    throw new Error("Los reportes pendientes requieren un dispositivo móvil.");
  const items = await loadPending(report.userId);
  if (items.length >= 5)
    throw new Error(
      "Hay 5 reportes pendientes. Publica o elimina uno antes de continuar.",
    );
  const photoUri = `${FileSystem.documentDirectory}fitcrew-${report.id}.jpg`;
  await FileSystem.copyAsync({ from: report.photoUri, to: photoUri });
  const saved = { ...report, photoUri };
  await AsyncStorage.setItem(
    key(report.userId),
    JSON.stringify([...items, saved]),
  );
  return saved;
}
export async function removePending(report: PendingReport) {
  const items = await loadPending(report.userId);
  await AsyncStorage.setItem(
    key(report.userId),
    JSON.stringify(items.filter((r) => r.id !== report.id)),
  );
  await FileSystem.deleteAsync(report.photoUri, { idempotent: true }).catch(
    () => undefined,
  );
}
