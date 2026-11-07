import { Copy, Button } from "./ui";
import { useAppSelector } from "../hooks/store";
export function GymPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const gyms = useAppSelector((s) => s.gyms.items);
  return (
    <>
      <Copy>Selecciona el gimnasio</Copy>
      {gyms.length ? (
        gyms.map((g) => (
          <Button
            key={g.id}
            title={g.name}
            selected={value === g.id}
            secondary={value !== g.id}
            disabled={disabled}
            onPress={() => onChange(g.id)}
          />
        ))
      ) : (
        <Copy muted>
          No hay gimnasios disponibles. Revisa la conexión o la configuración de
          los gimnasios piloto.
        </Copy>
      )}
    </>
  );
}
