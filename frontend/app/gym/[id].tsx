import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  Button,
  Card,
  Copy,
  Loading,
  Notice,
  Occupancy,
  Screen,
} from "../../src/components/ui";
import { ReportPhoto } from "../../src/components/ReportPhoto";
import { useAppSelector } from "../../src/hooks/store";
import { useNow } from "../../src/hooks/useNow";
import {
  ageLabel,
  isRecent,
  summarize,
} from "../../../backend/utils/occupancy";
import { levels } from "../../src/constants/theme";
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useAppSelector((s) => s.gyms);
  const now = useNow();
  const [visible, setVisible] = useState(10);
  const [openedPhotos, setOpenedPhotos] = useState<string[]>([]);
  const gym = state.items.find((g) => g.id === id);
  const reports = state.reports[id];
  const latest = reports?.[0];
  if (!gym && state.loading)
    return (
      <Screen title="Cargando gimnasio">
        <Loading />
      </Screen>
    );
  if (!gym)
    return (
      <Screen title="Gimnasio no disponible">
        <Notice
          message={state.error || "Regresa al listado y verifica tu conexión."}
          error
        />
      </Screen>
    );
  if (reports === undefined)
    return (
      <Screen title={gym.name} subtitle={gym.address}>
        {state.errors[id] ? (
          <Notice message={state.errors[id]} error />
        ) : (
          <Loading />
        )}
        <Copy muted>
          {state.errors[id]
            ? "No se pudo consultar la ocupación. Verifica tu conexión e inténtalo de nuevo."
            : "Consultando los últimos reportes…"}
        </Copy>
      </Screen>
    );
  return (
    <Screen title={gym.name} subtitle={gym.address}>
      <Notice message={state.errors[id] || ""} error />
      {reports === undefined && !state.errors[id] ? <Loading /> : null}
      <Card>
        <Copy title>Ocupación reportada</Copy>
        <Occupancy level={latest?.level} stale={!isRecent(latest, now)} />
        {latest ? (
          <>
            <Copy muted>{ageLabel(latest.createdAt, now)}</Copy>
            {!isRecent(latest, now) ? (
              <Notice message="Este reporte tiene más de una hora o aún no confirma su fecha. La ocupación actual no está disponible." />
            ) : null}
            <ReportPhoto
              path={latest.photoPath}
              priority="high"
              label={`Fotografía del último reporte de ${gym.name}`}
            />
          </>
        ) : (
          <Copy muted>
            Aún no hay información disponible. Puedes publicar el primer
            reporte.
          </Copy>
        )}
        <Button
          title="Reportar ocupación"
          onPress={() =>
            router.push({ pathname: "/(tabs)/report", params: { gymId: id } })
          }
        />
      </Card>
      <Card>
        <Copy title>Ocupación por horario</Copy>
        <Copy muted>
          Promedio redondeado de hasta 100 reportes recientes, en horario de
          Colombia. Es un resumen histórico, no una predicción.
        </Copy>
        {summarize(reports ?? []).map((b) => (
          <Copy key={b.label}>
            {b.label}: {b.level ? levels[b.level].label : "Sin datos"} (
            {b.count} reportes)
          </Copy>
        ))}
      </Card>
      <Copy title>Historial</Copy>
      {reports?.length === 0 ? (
        <Copy muted>No hay reportes registrados.</Copy>
      ) : null}
      {reports?.slice(0, visible).map((r) => (
        <Card key={r.id}>
          <Occupancy level={r.level} />
          <Copy muted>
            {ageLabel(r.createdAt, now)}
            {r.createdAt
              ? ` · ${new Date(r.createdAt).toLocaleString("es-CO")}`
              : ""}
          </Copy>
          {r.id !== latest?.id ? (
            openedPhotos.includes(r.id) ? (
              <ReportPhoto
                path={r.photoPath}
                priority="low"
                label={`Evidencia de ocupación ${levels[r.level].label}`}
              />
            ) : (
              <Button
                title="Ver fotografía del reporte"
                secondary
                onPress={() => setOpenedPhotos((current) => [...current, r.id])}
              />
            )
          ) : (
            <Copy muted>Fotografía mostrada en el último reporte.</Copy>
          )}
        </Card>
      ))}
      {reports && reports.length > visible ? (
        <Button
          title="Ver más reportes"
          secondary
          onPress={() => setVisible((n) => n + 10)}
        />
      ) : null}
    </Screen>
  );
}
