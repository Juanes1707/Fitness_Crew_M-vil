import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { photoUrl } from "../../../backend/services/reportService";
import { Notice } from "./ui";
export function ReportPhoto({
  path,
  label,
  priority = "normal",
}: {
  path: string;
  label: string;
  priority?: "high" | "normal" | "low";
}) {
  // Cada ruta nueva reinicia la carga sin mostrar la imagen anterior.
  return (
    <PhotoContent key={path} path={path} label={label} priority={priority} />
  );
}
function PhotoContent({
  path,
  label,
  priority,
}: {
  path: string;
  label: string;
  priority: "high" | "normal" | "low";
}) {
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
  return (
    <View style={photoStyles.frame}>
      {uri ? (
        <Image
          source={{ uri, cacheKey: `report-photos/${path}` }}
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={path}
          priority={priority}
          transition={120}
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
      )}
    </View>
  );
}
const photoStyles = StyleSheet.create({
  frame: { width: "100%", aspectRatio: 4 / 3 },
  image: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
});
