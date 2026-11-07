import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Card, Copy, Notice, Screen } from "../../src/components/ui";
import { useAppDispatch, useAppSelector } from "../../src/hooks/store";
import {
  ThemeMode,
  themeChanged,
} from "../../src/store/slices/preferencesSlice";
import { logout } from "../../../backend/services/authService";
import { errorMessage } from "../../../backend/utils/validation";
export default function Profile() {
  const { user } = useAppSelector((s) => s.auth);
  const mode = useAppSelector((s) => s.preferences.theme);
  const dispatch = useAppDispatch();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const changeTheme = async (theme: ThemeMode) => {
    dispatch(themeChanged(theme));
    try {
      await AsyncStorage.setItem("fitcrew:theme", theme);
    } catch {
      setError(
        "El tema cambió, pero no se pudo guardar la preferencia en este dispositivo.",
      );
    }
  };
  return (
    <Screen title="Tu perfil">
      <Card>
        <Copy title>{user?.name}</Copy>
        <Copy>{user?.email}</Copy>
      </Card>
      <Card>
        <Copy title>Apariencia</Copy>
        {(["system", "light", "dark"] as ThemeMode[]).map((theme) => (
          <Button
            key={theme}
            title={
              {
                system: "Usar tema del dispositivo",
                light: "Modo claro",
                dark: "Modo oscuro",
              }[theme]
            }
            secondary={mode !== theme}
            selected={mode === theme}
            onPress={() => void changeTheme(theme)}
          />
        ))}
        <Copy muted>
          El tamaño del texto sigue la configuración de accesibilidad del
          dispositivo.
        </Copy>
      </Card>
      <Notice message={error} error />
      <Button
        title="Cerrar sesión"
        secondary
        busy={busy}
        onPress={() => {
          setBusy(true);
          void logout()
            .catch((e) => setError(errorMessage(e)))
            .finally(() => setBusy(false));
        }}
      />
      <Copy muted>
        Los reportes pendientes permanecen en este dispositivo y sólo aparecen
        al volver a entrar con la misma cuenta.
      </Copy>
    </Screen>
  );
}
