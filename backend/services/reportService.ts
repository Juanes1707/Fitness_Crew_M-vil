import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { PendingReport } from "../types";
import { backend } from "./supabase";

export async function publishReport(report: PendingReport) {
  const client = backend();
  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user.id !== report.userId)
    throw new Error("Inicia sesión con la cuenta que guardó el reporte.");
  if (
    !report.gymId ||
    !["empty", "medium", "full"].includes(report.level) ||
    !report.photoUri
  )
    throw new Error("Selecciona gimnasio, ocupación y fotografía.");
  const { data: existing, error: readError } = await client
    .from("reports")
    .select("id,user_id,gym_id")
    .eq("id", report.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) {
    if (existing.user_id !== report.userId || existing.gym_id !== report.gymId)
      throw new Error("El identificador ya pertenece a otro reporte.");
    return;
  }
  const photoPath = `${report.userId}/${report.id}.jpg`;
  // ArrayBuffer es el formato recomendado por Supabase para React Native.
  const base64 = await FileSystem.readAsStringAsync(report.photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = decode(base64);
  if (!bytes.byteLength || bytes.byteLength >= 5 * 1024 * 1024)
    throw new Error(
      "La fotografía debe ocupar menos de 5 MB. Toma otra fotografía.",
    );
  const { error: uploadError } = await client.storage
    .from("report-photos")
    .upload(photoPath, bytes, { contentType: "image/jpeg", upsert: false });
  // Una foto puede haber llegado antes de un fallo de escritura o timeout.
  if (
    uploadError &&
    String((uploadError as { statusCode?: string }).statusCode) !== "409" &&
    uploadError.message !== "The resource already exists"
  )
    throw uploadError;
  const { error: writeError } = await client.from("reports").insert({
    id: report.id,
    gym_id: report.gymId,
    user_id: report.userId,
    level: report.level,
    photo_path: photoPath,
  });
  if (writeError) {
    // Conflicto entre dos reintentos simultáneos: comprobar quién lo confirmó.
    if (writeError.code === "23505") {
      const { data, error } = await client
        .from("reports")
        .select("user_id,gym_id")
        .eq("id", report.id)
        .single();
      if (
        !error &&
        data.user_id === report.userId &&
        data.gym_id === report.gymId
      )
        return;
    }
    throw writeError;
  }
}
export async function photoUrl(path: string) {
  const { data, error } = await backend()
    .storage.from("report-photos")
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
