import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "../src/store/index";
import { sessionChanged } from "../src/store/slices/authSlice";
import {
  gymsReceived,
  gymsFailed,
  gymsReset,
  reportsReceived,
  reportsFailed,
} from "../src/store/slices/gymSlice";
import { themeChanged } from "../src/store/slices/preferencesSlice";
import { watchAuth } from "../../backend/services/authService";
import { supabaseConfigured } from "../../backend/services/supabase";
import { watchGyms, watchReports } from "../../backend/services/gymService";
import { useAppDispatch, useAppSelector } from "../src/hooks/store";
import { useTheme } from "../src/hooks/useTheme";
import { errorMessage } from "../../backend/utils/validation";
import { Button, Copy, Loading, Notice, Screen } from "../src/components/ui";

function Root() {
  const dispatch = useAppDispatch();
  const { user, ready } = useAppSelector((s) => s.auth);
  const gyms = useAppSelector((s) => s.gyms.items);
  const t = useTheme();
  const uid = user?.uid;
  const [authError, setAuthError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem("fitcrew:theme")
      .then((mode) => {
        if (mode === "light" || mode === "dark" || mode === "system")
          dispatch(themeChanged(mode));
      })
      .catch(() => undefined);
  }, [dispatch]);
  useEffect(() => {
    if (!supabaseConfigured) return;
    return watchAuth(
      (u) => dispatch(sessionChanged(u)),
      (e) => setAuthError(errorMessage(e)),
    );
  }, [dispatch, attempt]);
  useEffect(() => {
    dispatch(gymsReset());
    if (!uid) return;
    return watchGyms(
      (items) => dispatch(gymsReceived(items)),
      (e) => dispatch(gymsFailed(errorMessage(e))),
    );
  }, [dispatch, uid, attempt]);
  useEffect(() => {
    if (!uid) return;
    const stops = gyms.map((g) =>
      watchReports(
        g.id,
        (reports) => dispatch(reportsReceived({ id: g.id, reports })),
        (e) => dispatch(reportsFailed({ id: g.id, error: errorMessage(e) })),
      ),
    );
    return () => stops.forEach((stop) => stop());
  }, [dispatch, gyms, uid, attempt]);
  if (!supabaseConfigured)
    return (
      <Screen title="Conecta FitCrew">
        <Copy>
          La configuración del servicio todavía no está disponible. El equipo
          debe completar la URL y la clave pública de Supabase y reiniciar Expo.
        </Copy>
        <Copy muted>
          Consulta las instrucciones de configuración del README. No se muestran
          datos de demostración.
        </Copy>
      </Screen>
    );
  if (authError)
    return (
      <Screen title="No se pudo abrir la sesión">
        <Notice message={authError} error />
        <Button
          title="Reintentar"
          onPress={() => {
            setAuthError("");
            setAttempt((a) => a + 1);
          }}
        />
      </Screen>
    );
  if (!ready)
    return (
      <Screen title="Abriendo FitCrew">
        <Loading />
      </Screen>
    );
  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.surface },
          headerTintColor: t.text,
          contentStyle: { backgroundColor: t.background },
          headerBackTitle: "Atrás",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: "Crear cuenta" }} />
        </Stack.Protected>
        <Stack.Protected guard={!!user} redirectTo="/login">
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="gym/[id]" options={{ title: "Tu gimnasio" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
export default function Layout() {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
}
