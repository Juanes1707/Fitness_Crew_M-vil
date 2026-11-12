import { backend } from "./supabase";

// Fotos inmutables. Reutilizar firma durante 50 min (vence en 60), incluidas
// peticiones simultáneas. Sólo memoria; se invalida al cambiar/cerrar sesión.
const urls = new Map<string, { expiresAt: number; request: Promise<string> }>();
export function clearPhotoUrlCache() {
  urls.clear();
}
export function photoUrl(path: string): Promise<string> {
  const cached = urls.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.request;
  const entry = {
    expiresAt: Date.now() + 50 * 60 * 1000,
    request: Promise.resolve()
      .then(async () => {
        const { data, error } = await backend()
          .storage.from("report-photos")
          .createSignedUrl(path, 3600);
        if (error) throw error;
        if (!data?.signedUrl)
          throw new Error("No se pudo cargar la fotografía.");
        return data.signedUrl;
      })
      .catch((error) => {
        if (urls.get(path) === entry) urls.delete(path);
        throw error;
      }),
  };
  urls.set(path, entry);
  if (urls.size > 200) urls.delete(urls.keys().next().value!);
  return entry.request;
}
