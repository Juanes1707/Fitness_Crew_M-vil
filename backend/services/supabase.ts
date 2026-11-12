import "react-native-url-polyfill/auto";
import { sessionStorage } from "./sessionStorage";
import { createClient, processLock } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { decode } from "base64-arraybuffer";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
function isPublicKey(value?: string) {
  if (!value) return false;
  if (value.startsWith("sb_publishable_")) return true;
  // También acepta la anon key JWT clásica, pero rechaza service_role.
  try {
    const payload = value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return (
      JSON.parse(String.fromCharCode(...new Uint8Array(decode(payload))))
        .role === "anon"
    );
  } catch {
    return false;
  }
}
export const supabaseConfigured =
  !!url && /^https?:\/\//.test(url) && isPublicKey(publicKey);
const client = supabaseConfigured
  ? createClient(url!, publicKey!, {
      auth: {
        storage: Platform.OS === "web" ? undefined : sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;
export function backend() {
  if (!client)
    throw new Error(
      "Completa la URL y la clave pública de Supabase en frontend/.env y reinicia Expo.",
    );
  return client;
}
