import { useState } from "react";
import { router } from "expo-router";
import {
  Button,
  Card,
  Copy,
  Field,
  Loading,
  Notice,
  Occupancy,
  Screen,
} from "../../src/components/ui";
import { useAppSelector } from "../../src/hooks/store";
import { useNow } from "../../src/hooks/useNow";
import {
  ageLabel,
  isRecent,
  searchGyms,
} from "../../../backend/utils/occupancy";
export default function Gyms() {
  const [term, setTerm] = useState("");
  const state = useAppSelector((s) => s.gyms);
  const now = useNow();
  const gyms = searchGyms(state.items, term);
  return (
    <Screen
      title="Encuentra tu momento"
      subtitle="Consulta los reportes de la comunidad antes de entrenar."
    >
      <Field
        label="Buscar gimnasio"
        placeholder="Nombre del gimnasio"
        value={term}
        onChangeText={setTerm}
      />
      <Notice message={state.error} error />
      {state.loading ? <Loading /> : null}
      {!state.loading && !gyms.length ? (
        <Copy muted>
          {state.items.length
            ? "No encontramos gimnasios con ese nombre."
            : "No hay gimnasios disponibles. Revisa tu conexión o solicita al equipo la carga de los gimnasios piloto."}
        </Copy>
      ) : null}
      {gyms.map((g) => {
        const report = state.reports[g.id]?.[0];
        return (
          <Card key={g.id}>
            <Copy title>{g.name}</Copy>
            <Copy muted>{g.address}</Copy>
            <Notice message={state.errors[g.id] || ""} error />
            {state.reports[g.id] === undefined && !state.errors[g.id] ? (
              <Loading />
            ) : (
              <Occupancy level={report?.level} stale={!isRecent(report, now)} />
            )}
            {report ? (
              <Copy muted>{ageLabel(report.createdAt, now)}</Copy>
            ) : null}
            <Button
              title={`Ver ${g.name}`}
              secondary
              onPress={() =>
                router.push({ pathname: "/gym/[id]", params: { id: g.id } })
              }
            />
          </Card>
        );
      })}
    </Screen>
  );
}
