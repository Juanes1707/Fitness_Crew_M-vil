import { AppState, Platform } from "react-native";
import type { User } from "@supabase/supabase-js";
import { UserProfile } from "../types";
import { backend } from "./supabase";
import { validateAuth } from "../utils/validation";
import { withTimeout } from "../utils/timeout";
import { clearPhotoUrlCache } from "./photoService";

function profile(user: User): UserProfile {
  return {
    uid: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name || "Integrante",
  };
}
export async function login(email: string, password: string) {
  const invalid = validateAuth(email, password);
  if (invalid) throw new Error(invalid);
  const { error } = await backend().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<UserProfile | null> {
  const invalid = validateAuth(email, password, name);
  if (invalid) throw new Error(invalid);
  const { data, error } = await backend().auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  });
  if (error) throw error;
  // Con confirmación por correo, crear la cuenta no inicia una sesión.
  return data.session ? profile(data.session.user) : null;
}
export async function logout() {
  const { error } = await backend().auth.signOut({ scope: "local" });
  if (error) throw error;
  clearPhotoUrlCache();
}
export function watchAuth(
  next: (user: UserProfile | null) => void,
  error: (error: unknown) => void,
) {
  const client = backend();
  let active = true;
  let receivedEvent = false;
  let currentUserId: string | null | undefined;
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    // Callback síncrono: nunca llamar aquí a otras operaciones auth con await.
    receivedEvent = true;
    const uid = session?.user.id ?? null;
    if (uid !== currentUserId) {
      clearPhotoUrlCache();
      currentUserId = uid;
    }
    if (active) next(session ? profile(session.user) : null);
  });
  void withTimeout(client.auth.getSession())
    .then(({ data, error: failure }) => {
      if (failure) throw failure;
      if (active && !receivedEvent)
        next(data.session ? profile(data.session.user) : null);
    })
    .catch((e) => {
      if (active) error(e);
    });
  const refresh = (state: string) => {
    if (state === "active") client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  };
  if (Platform.OS !== "web") refresh(AppState.currentState ?? "active");
  const appState =
    Platform.OS !== "web" ? AppState.addEventListener("change", refresh) : null;
  return () => {
    active = false;
    subscription.unsubscribe();
    appState?.remove();
    if (Platform.OS !== "web") client.auth.stopAutoRefresh();
  };
}
