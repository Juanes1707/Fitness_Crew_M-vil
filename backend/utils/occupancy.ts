import { Gym, Report } from "../types/index";
export function searchGyms(gyms: Gym[], term: string) {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  return gyms.filter((g) => normalize(g.name).includes(normalize(term)));
}
export function ageLabel(time: number | null, now = Date.now()) {
  if (time === null) return "Sin fecha confirmada";
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) return "Hace menos de un minuto";
  if (minutes < 60) return `Hace ${minutes} min`;
  if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} h`;
  return `Hace ${Math.floor(minutes / 1440)} días`;
}
export function isRecent(report?: Report, now = Date.now()) {
  return report?.createdAt != null && now - report.createdAt <= 60 * 60000;
}
// Resumen descriptivo, nunca predicción. Horas de Colombia, no del dispositivo.
export function summarize(reports: Report[]) {
  const buckets = [
    { label: "Mañana · 06–12", count: 0, total: 0 },
    { label: "Tarde · 12–18", count: 0, total: 0 },
    { label: "Noche · 18–06", count: 0, total: 0 },
  ];
  for (const report of reports) {
    if (report.createdAt === null) continue;
    const hour = new Date(report.createdAt - 5 * 3600000).getUTCHours();
    const bucket =
      buckets[hour >= 6 && hour < 12 ? 0 : hour >= 12 && hour < 18 ? 1 : 2];
    bucket.count++;
    bucket.total += { empty: 0, medium: 1, full: 2 }[report.level];
  }
  return buckets.map((b) => ({
    label: b.label,
    count: b.count,
    level: b.count
      ? (["empty", "medium", "full"] as const)[Math.round(b.total / b.count)]
      : null,
  }));
}
