import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

// No registra usuarios ni modifica tablas o archivos. El flag de prueba verifica
// un acceso incorrecto con una identidad sintética, sin enviar correos.
try {
  const source = await readFile(
    new URL("../../frontend/.env", import.meta.url),
    "utf8",
  );
  const values = Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => {
        const i = line.indexOf("=");
        return [
          line.slice(0, i),
          line
            .slice(i + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
  const url = values.EXPO_PUBLIC_SUPABASE_URL;
  const key = values.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let publicKey = key?.startsWith("sb_publishable_");
  if (!publicKey) {
    try {
      publicKey =
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
          .role === "anon";
    } catch {
      /* Mostrar error sin exponer el valor. */
    }
  }
  if (!url || !publicKey)
    throw new Error(
      "Completa frontend/.env con la URL y la Publishable key (o anon key), nunca service_role.",
    );
  const get = async (route) => {
    const response = await fetch(url.replace(/\/$/, "") + route, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(15000),
    });
    return { status: response.status, body: await response.json() };
  };
  const auth = await get("/auth/v1/settings");
  if (auth.status !== 200)
    throw new Error(
      `Auth responde HTTP ${auth.status}. Revisa la URL y la clave pública.`,
    );
  console.log(
    `Conexión: OK. Registro por correo: ${auth.body.external?.email ? "habilitado" : "deshabilitado"}. Confirmación de correo: ${auth.body.mailer_autoconfirm ? "desactivada" : "activada"}.`,
  );
  const db = await get("/rest/v1/gyms?select=id&limit=1");
  if (db.body.code === "PGRST205")
    throw new Error(
      "Falta la tabla gyms. Ejecuta backend/supabase/migrations/001_fitcrew.sql en SQL Editor.",
    );
  if (db.body.code === "42501")
    console.log(
      "Tabla gyms: encontrada. Acceso anónimo bloqueado como se espera.",
    );
  else if (db.status === 200)
    throw new Error(
      "gyms permite acceso anónimo. Revisa los grants y políticas antes de continuar.",
    );
  else
    throw new Error(
      `La consulta de gyms respondió HTTP ${db.status} (${db.body.code ?? "sin código"}).`,
    );
  if (process.argv.includes("--test-invalid-login")) {
    const response = await fetch(
      url.replace(/\/$/, "") + "/auth/v1/token?grant_type=password",
      {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "qa-no-account@fitcrew.invalid",
          password: "Invalid-QA-password-123!",
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    if (
      response.status !== 400 ||
      (result.error_code ?? result.code) !== "invalid_credentials" ||
      result.access_token
    ) {
      throw new Error(
        `El acceso incorrecto no produjo la respuesta esperada: HTTP ${response.status}.`,
      );
    }
    console.log(
      "Auth alojado: credenciales incorrectas rechazadas (HTTP 400, invalid_credentials), sin crear sesión.",
    );
  }
  console.log(
    "Pendiente: iniciar sesión en la app y probar Auth, fotos, RLS y Realtime con usuarios reales.",
  );
} catch (error) {
  console.error(
    error.message === "fetch failed"
      ? `No se pudo conectar (${error.cause?.code ?? "red"}). Revisa tu conexión y el estado del proyecto.`
      : error.message,
  );
  process.exitCode = 1;
}
