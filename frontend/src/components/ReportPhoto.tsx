import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";
import { photoUrl } from "../../../backend/services/reportService";
import { Notice } from "./ui";
export function ReportPhoto({ path, label }: { path: string; label: string }) {
  // Cada ruta nueva reinicia la carga sin mostrar la imagen anterior.
  return <PhotoContent key={path} path={path} label={label} />;
}
function PhotoContent({ path, label }: { path: string; label: string }) {
  const [uri, setUri] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    photoUrl(path)
      .then((url) => {
        if (active) setUri(url);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar la fotografía.");
      });
    return () => {
      active = false;
    };
  }, [path]);
  return uri ? (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      accessible
      style={photoStyles.image}
      onError={() => {
        setUri("");
        setError("No se pudo cargar la fotografía.");
      }}
    />
  ) : (
    <Notice message={error || "Cargando fotografía…"} error={!!error} />
  );
}
const photoStyles = StyleSheet.create({
  image: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
});
