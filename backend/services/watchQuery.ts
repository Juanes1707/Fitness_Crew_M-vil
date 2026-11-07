import { AppState } from "react-native";
import { backend } from "./supabase";
import { withTimeout } from "../utils/timeout";

// Realtime avisa de cambios; luego se consulta otra vez bajo RLS.
// El refresco periódico recupera datos tras cortes sin inventar un estado local.
let channelId = 0;
export function watchQuery<T>(
  table: string,
  load: () => Promise<T>,
  next: (data: T) => void,
  error: (e: unknown) => void,
  filter?: string,
) {
  const client = backend();
  let disposed = false;
  let running = false;
  let dirty = false;
  const refresh = async () => {
    if (disposed) return;
    if (running) {
      dirty = true;
      return;
    }
    running = true;
    do {
      dirty = false;
      try {
        const result = await withTimeout(load());
        if (!disposed) next(result);
      } catch (e) {
        if (!disposed) error(e);
      }
    } while (dirty && !disposed);
    running = false;
  };
  const channel = client
    .channel(`fitcrew-${table}-${++channelId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
      () => {
        void refresh();
      },
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void refresh();
      if (!disposed && (status === "CHANNEL_ERROR" || status === "TIMED_OUT"))
        error(
          new Error(
            "No se pudo mantener la conexión en vivo. Se reintentará la consulta periódicamente.",
          ),
        );
    });
  const timer = setInterval(() => {
    void refresh();
  }, 30000);
  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") void refresh();
  });
  void refresh();
  return () => {
    disposed = true;
    clearInterval(timer);
    appState.remove();
    void client.removeChannel(channel).catch(() => undefined);
  };
}
