import { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { Level } from "../../../backend/types/index";
import { levels } from "../constants/theme";

export function Copy({
  children,
  muted = false,
  title = false,
}: {
  children: ReactNode;
  muted?: boolean;
  title?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      style={[
        styles.copy,
        { color: muted ? t.muted : t.text },
        title && styles.title,
      ]}
      accessibilityRole={title ? "header" : undefined}
    >
      {children}
    </Text>
  );
}
export function Screen({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const t = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.fill, { backgroundColor: t.background }]}
    >
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.page}
        >
          <View style={styles.brand}>
            <Text style={[styles.wordmark, { color: t.primary }]}>FitCrew</Text>
            <Text style={{ color: t.muted, fontSize: 15 }}>
              Entrena en comunidad
            </Text>
          </View>
          <Copy title>{title}</Copy>
          {subtitle ? <Copy muted>{subtitle}</Copy> : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Card({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  busy,
  secondary = false,
  selected,
  hint,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  secondary?: boolean;
  selected?: boolean;
  hint?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{
        disabled: disabled || busy,
        busy: !!busy,
        selected,
      }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: t.primary,
          backgroundColor: secondary ? t.surface : t.primary,
          opacity: disabled || busy ? 0.6 : pressed ? 0.8 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? t.primary : t.onPrimary} />
      ) : null}
      <Text
        style={[
          styles.buttonText,
          { color: secondary ? t.primary : t.onPrimary },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Copy>{label}</Copy>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        style={[
          styles.input,
          { borderColor: t.border, color: t.text, backgroundColor: t.surface },
        ]}
      />
    </View>
  );
}
export function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  const t = useTheme();
  return message ? (
    <Text
      accessibilityRole={error ? "alert" : undefined}
      accessibilityLiveRegion="polite"
      style={[styles.copy, { color: error ? t.error : t.muted }]}
    >
      {message}
    </Text>
  ) : null;
}
export function Loading() {
  const t = useTheme();
  return (
    <ActivityIndicator
      size="large"
      color={t.primary}
      accessibilityLabel="Cargando"
    />
  );
}
export function Occupancy({
  level,
  stale,
}: {
  level?: Level;
  stale?: boolean;
}) {
  return (
    <Copy>
      {level
        ? `${levels[level].icon} ${levels[level].label}${stale ? " · Desactualizado" : ""}`
        : "Sin reportes disponibles"}
    </Copy>
  );
}
export const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: {
    padding: 22,
    gap: 18,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  brand: { gap: 3, paddingBottom: 14 },
  wordmark: { fontSize: 29, fontWeight: "900", letterSpacing: -1 },
  copy: { fontSize: 17, lineHeight: 26, flexShrink: 1 },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  card: { padding: 20, borderWidth: 1, borderRadius: 16, gap: 13 },
  button: {
    minWidth: 50,
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  field: { gap: 8 },
  input: {
    minHeight: 52,
    padding: 13,
    fontSize: 17,
    lineHeight: 25,
    borderWidth: 1,
    borderRadius: 10,
  },
});
