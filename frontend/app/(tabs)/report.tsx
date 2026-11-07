import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Notice,
  Occupancy,
  Screen,
} from "../../src/components/ui";
import { GymPicker } from "../../src/components/GymPicker";
import { useAppSelector } from "../../src/hooks/store";
import { Level, PendingReport } from "../../../backend/types";
import { levels } from "../../src/constants/theme";
import { publishReport } from "../../../backend/services/reportService";
import {
  loadPending,
  removePending,
  savePending,
} from "../../../backend/services/pendingService";
import { errorMessage } from "../../../backend/utils/validation";
import { withTimeout } from "../../../backend/utils/timeout";

export default function ReportScreen() {
  const user = useAppSelector((s) => s.auth.user)!;
  const gyms = useAppSelector((s) => s.gyms.items);
  const params = useLocalSearchParams<{ gymId?: string }>();
  const router = useRouter();
  const gymId = params.gymId ?? "";
  const [level, setLevel] = useState<Level | undefined>();
  const [photo, setPhoto] = useState("");
  const [capturedAt, setCapturedAt] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  useFocusEffect(
    useCallback(
      () => () => {
        setCameraOpen(false);
        setCameraReady(false);
      },
      [],
    ),
  );
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PendingReport[]>([]);
  const reload = useCallback(
    async () => setPending(await loadPending(user.uid)),
    [user.uid],
  );
  useEffect(() => {
    let active = true;
    loadPending(user.uid)
      .then((items) => {
        if (active) setPending(items);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [user.uid]);
  const run = async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  const openCamera = () =>
    run(async () => {
      const result = permission?.granted
        ? permission
        : await requestPermission();
      if (!result.granted) {
        setError(
          "La cámara necesita permiso. Puedes habilitarlo en los ajustes del dispositivo.",
        );
        return;
      }
      setCameraReady(false);
      setCameraOpen(true);
    });
  const capture = () =>
    run(async () => {
      const result = await camera.current?.takePictureAsync({ quality: 0.45 });
      if (!result?.uri)
        throw new Error("No se pudo tomar la fotografía. Intenta de nuevo.");
      setPhoto(result.uri);
      setCapturedAt(Date.now());
      setCameraOpen(false);
    });
  const submit = () =>
    run(async () => {
      if (!gymId || !level || !photo)
        throw new Error(
          "Selecciona un gimnasio, un nivel y toma una fotografía.",
        );
      const saved = await savePending({
        id: Crypto.randomUUID(),
        gymId,
        level,
        photoUri: photo,
        capturedAt,
        userId: user.uid,
      });
      setPhoto("");
      setLevel(undefined);
      await reload();
      await withTimeout(publishReport(saved));
      await removePending(saved);
      await reload();
      setMessage("Reporte publicado. Gracias por compartir.");
    });
  return (
    <Screen
      title="Comparte la ocupación"
      subtitle="Una foto y un reporte ayudan al próximo integrante."
    >
      <Notice message={error} error />
      <Notice message={message} />
      {cameraOpen ? (
        <Card>
          <Copy>No fotografíes rostros sin consentimiento.</Copy>
          <View style={local.camera}>
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
              onMountError={() => {
                setCameraOpen(false);
                setError(
                  "La cámara no está disponible. Cierra otras aplicaciones que la estén usando.",
                );
              }}
            />
          </View>
          <Button
            title="Tomar fotografía"
            disabled={!cameraReady}
            busy={busy}
            onPress={() => void capture()}
          />
          <Button
            title="Cancelar fotografía"
            secondary
            disabled={busy}
            onPress={() => setCameraOpen(false)}
          />
        </Card>
      ) : (
        <Card>
          <GymPicker
            value={gymId}
            disabled={busy}
            onChange={(id) => {
              if (!busy) router.setParams({ gymId: id });
            }}
          />
          <Copy>¿Cómo está la ocupación?</Copy>
          {(Object.keys(levels) as Level[]).map((l) => (
            <Button
              key={l}
              title={`${levels[l].icon} ${levels[l].label}`}
              selected={level === l}
              secondary={level !== l}
              disabled={busy}
              onPress={() => setLevel(l)}
            />
          ))}
          <Copy muted>
            Evita fotografiar rostros de personas sin su consentimiento.
          </Copy>
          {photo ? (
            <Image
              source={{ uri: photo }}
              accessible
              accessibilityLabel="Vista previa de la fotografía que vas a publicar"
              style={local.preview}
            />
          ) : null}
          <Button
            title={photo ? "Tomar otra fotografía" : "Abrir cámara"}
            secondary
            disabled={busy}
            onPress={() => void openCamera()}
          />
          {permission && !permission.granted && !permission.canAskAgain ? (
            <Button
              title="Abrir ajustes de permisos"
              secondary
              onPress={() => {
                void Linking.openSettings().catch((e) =>
                  setError(errorMessage(e)),
                );
              }}
            />
          ) : null}
          <Button
            title="Confirmar y publicar"
            busy={busy}
            onPress={() => void submit()}
            hint="Guarda la foto y publica el reporte. Si falla la conexión podrás reintentarlo abajo."
          />
        </Card>
      )}
      <Copy title>Reportes pendientes ({pending.length}/5)</Copy>
      <Copy muted>
        Se guardan en este dispositivo y en esta cuenta. Reintenta con conexión.
        La fecha del reporte corresponde a su publicación; descarta fotos
        antiguas.
      </Copy>
      {pending.map((p) => (
        <Card key={p.id}>
          <Copy>{gyms.find((g) => g.id === p.gymId)?.name ?? "Gimnasio"}</Copy>
          <Occupancy level={p.level} />
          <Copy muted>
            Foto tomada: {new Date(p.capturedAt).toLocaleString("es-CO")}
          </Copy>
          <Image
            source={{ uri: p.photoUri }}
            style={local.preview}
            accessible
            accessibilityLabel="Fotografía guardada pendiente de publicación"
          />
          <Button
            title="Reintentar publicación"
            disabled={busy}
            onPress={() =>
              void run(async () => {
                await withTimeout(publishReport(p));
                await removePending(p);
                await reload();
                setMessage("Reporte publicado.");
              })
            }
          />
          <Button
            title="Eliminar pendiente de este dispositivo"
            secondary
            disabled={busy}
            onPress={() =>
              void run(async () => {
                await removePending(p);
                await reload();
                setMessage("Pendiente eliminado del dispositivo.");
              })
            }
          />
        </Card>
      ))}
    </Screen>
  );
}
const local = StyleSheet.create({
  camera: { height: 340, overflow: "hidden", borderRadius: 12 },
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
});
