import { useState } from "react";
import { router } from "expo-router";
import { Button, Card, Field, Notice, Screen } from "./ui";
import { login, register } from "../../../backend/services/authService";
import { errorMessage, validateAuth } from "../../../backend/utils/validation";
import { useAppDispatch } from "../hooks/store";
import { sessionChanged } from "../store/slices/authSlice";
import { withTimeout } from "../../../backend/utils/timeout";
export function AuthForm({ registration = false }: { registration?: boolean }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const invalid = validateAuth(
      email,
      password,
      registration ? name : undefined,
    );
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (registration) {
        const user = await withTimeout(register(name, email, password));
        if (user) dispatch(sessionChanged(user));
        else
          setMessage(
            "Revisa tu correo para confirmar la cuenta. Después vuelve e inicia sesión.",
          );
      } else await withTimeout(login(email, password));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title={
        registration ? "Haz parte del crew" : "Tu entrenamiento empieza aquí"
      }
      subtitle="Consulta la ocupación y comparte lo que encuentras."
    >
      <Card>
        {registration ? (
          <Field
            label="Nombre"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            maxLength={60}
          />
        ) : null}
        <Field
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={registration ? "new-password" : "current-password"}
          onSubmitEditing={() => {
            if (!busy) void submit();
          }}
        />
        <Notice message={error} error />
        <Notice message={message} />
        <Button
          title={registration ? "Crear cuenta" : "Iniciar sesión"}
          busy={busy}
          onPress={() => void submit()}
        />
      </Card>
      {!registration ? (
        <Button
          title="Crear una cuenta"
          secondary
          onPress={() => router.push("/register")}
        />
      ) : null}
      {registration ? (
        <Button
          title="Ir a iniciar sesión"
          secondary
          onPress={() => router.replace("/login")}
        />
      ) : null}
    </Screen>
  );
}
