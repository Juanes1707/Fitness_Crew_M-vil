import { useEffect, useState } from "react";
import { Share } from "react-native";
import {
  Button,
  Card,
  Copy,
  Field,
  Loading,
  Notice,
  Screen,
} from "../../src/components/ui";
import { GymPicker } from "../../src/components/GymPicker";
import { useAppSelector } from "../../src/hooks/store";
import { CheckIn, Group } from "../../../backend/types";
import {
  checkIn,
  createGroup,
  getGroupId,
  joinGroup,
  watchCheckIns,
  watchGroup,
} from "../../../backend/services/friendService";
import { ageLabel } from "../../../backend/utils/occupancy";
import { errorMessage } from "../../../backend/utils/validation";
import { withTimeout } from "../../../backend/utils/timeout";
import { useNow } from "../../src/hooks/useNow";
export default function Friends() {
  const user = useAppSelector((s) => s.auth.user)!;
  const gyms = useAppSelector((s) => s.gyms.items);
  const now = useNow();
  const [groupId, setGroupId] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<CheckIn[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [gymId, setGymId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [membershipReady, setMembershipReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    withTimeout(getGroupId(user.uid))
      .then((id) => {
        if (active) {
          setGroupId(id ?? "");
          setMembershipReady(true);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.uid, attempt]);
  useEffect(() => {
    if (!groupId) return;
    const fail = (e: unknown) => setError(errorMessage(e));
    const a = watchGroup(groupId, setGroup, fail);
    const b = watchCheckIns(groupId, setItems, fail);
    return () => {
      a();
      b();
    };
  }, [groupId, attempt]);
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await withTimeout(work());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Tu crew, en privado"
      subtitle="Comparte cuándo entrenas con tu grupo de amigos."
    >
      <Notice message={error} error />
      <Notice message={message} />
      {error ? (
        <Button
          title="Volver a cargar grupo"
          secondary
          disabled={busy}
          onPress={() => {
            setLoading(true);
            setMembershipReady(false);
            setGroup(null);
            setItems([]);
            setAttempt((a) => a + 1);
          }}
        />
      ) : null}
      {loading ? (
        <Loading />
      ) : !membershipReady ? (
        <Copy muted>
          No se pudo comprobar tu grupo. Vuelve a cargarlo antes de continuar.
        </Copy>
      ) : groupId ? (
        group ? (
          <>
            <Card>
              <Copy title>{group.name}</Copy>
              <Copy>{group.members.length} integrantes · máximo 20</Copy>
              <Copy muted>
                Comparte el código sólo con personas que quieras incorporar.
                Quien tenga el código puede unirse y consultar la actividad.
              </Copy>
              <Copy>{group.id}</Copy>
              <Button
                title="Compartir invitación"
                secondary
                onPress={() => {
                  void Share.share({
                    message: `Únete a mi grupo privado en FitCrew. Código: ${group.id}`,
                  }).catch((e) => setError(errorMessage(e)));
                }}
              />
            </Card>
            <Card>
              <GymPicker value={gymId} onChange={setGymId} disabled={busy} />
              <Button
                title="Registrar mi check-in"
                busy={busy}
                onPress={() =>
                  void run(async () => {
                    await checkIn(group.id, gymId, user);
                    setMessage("Check-in compartido con tu crew.");
                  })
                }
              />
            </Card>
            <Copy title>Actividad del grupo</Copy>
            {!items.length ? (
              <Copy muted>Aún no hay check-ins compartidos.</Copy>
            ) : null}
            {items.map((i) => (
              <Card key={i.id}>
                <Copy>
                  {i.name} está en{" "}
                  {gyms.find((g) => g.id === i.gymId)?.name ?? "un gimnasio"}
                </Copy>
                <Copy muted>{ageLabel(i.createdAt, now)}</Copy>
              </Card>
            ))}
          </>
        ) : (
          <Copy muted>
            Cargando grupo. Si no aparece, verifica tu conexión y vuelve a
            cargarlo.
          </Copy>
        )
      ) : (
        <>
          <Card>
            <Copy title>Crea tu grupo</Copy>
            <Field
              label="Nombre del grupo"
              value={name}
              onChangeText={setName}
              maxLength={60}
            />
            <Button
              title="Crear grupo privado"
              busy={busy}
              disabled={loading}
              onPress={() =>
                void run(async () => setGroupId(await createGroup(name)))
              }
            />
          </Card>
          <Card>
            <Copy title>¿Tienes una invitación?</Copy>
            <Field
              label="Código de invitación"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Unirme al grupo"
              secondary
              busy={busy}
              disabled={loading}
              onPress={() =>
                void run(async () => setGroupId(await joinGroup(code)))
              }
            />
          </Card>
        </>
      )}
    </Screen>
  );
}
