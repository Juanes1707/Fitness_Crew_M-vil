export function validateAuth(
  email: string,
  password: string,
  name?: string,
): string | null {
  if (name !== undefined && (!name.trim() || name.trim().length > 60))
    return "Escribe un nombre entre 1 y 60 caracteres.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return "Escribe un correo válido.";
  if (password.length < 6)
    return "La contraseña debe tener al menos 6 caracteres.";
  return null;
}
export function errorMessage(error: unknown): string {
  const e = error as {
    code?: string;
    message?: string;
    status?: number;
  } | null;
  const code = e?.code;
  if (code === "invalid_credentials") return "Correo o contraseña incorrectos.";
  if (code === "email_not_confirmed")
    return "Confirma tu correo antes de iniciar sesión.";
  if (code === "user_already_exists") return "Este correo ya está registrado.";
  if (code === "weak_password")
    return "La contraseña no cumple los requisitos del proyecto Supabase.";
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    e?.status === 429
  )
    return "Demasiados intentos. Espera unos minutos antes de reintentar.";
  if (code === "42501" || e?.status === 403)
    return "No tienes acceso. Verifica tu sesión y las políticas de Supabase.";
  if (["PGRST205", "42P01", "PGRST202"].includes(code ?? ""))
    return "Falta preparar la base de datos. Ejecuta el SQL de configuración en Supabase.";
  if (code === "23503")
    return "El gimnasio o grupo ya no está disponible. Actualiza la lista.";
  if (code === "23514")
    return "Revisa el nivel de ocupación, la fotografía y los datos del reporte.";
  if (code === "P0001" && e?.message) return e.message;
  if (
    e?.message &&
    /network request failed|failed to fetch|fetch failed|networkerror/i.test(
      e.message,
    )
  )
    return "No hay conexión con el servicio. Revisa tu red y vuelve a intentar.";
  return error instanceof Error && !code
    ? error.message
    : "No se pudo completar la operación. Vuelve a intentar.";
}
