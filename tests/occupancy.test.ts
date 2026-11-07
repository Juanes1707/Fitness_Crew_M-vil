import {
  ageLabel,
  isRecent,
  searchGyms,
  summarize,
} from "../backend/utils/occupancy";
import { Report } from "../backend/types";
const report = (level: Report["level"], hour: number): Report => ({
  id: String(hour),
  gymId: "pilot",
  userId: "u",
  level,
  photoPath: "reports/u/r.jpg",
  createdAt: Date.UTC(2026, 10, 7, hour + 5),
});
test("busca nombres sin distinguir acentos ni mayúsculas", () => {
  expect(
    searchGyms(
      [{ id: "a", name: "Gimnasio Sabána", address: "Campus" }],
      " SABANA ",
    ),
  ).toHaveLength(1);
  expect(
    searchGyms([{ id: "a", name: "Campus", address: "" }], "otro"),
  ).toEqual([]);
});
test("distingue reportes recientes, vencidos y fechas pendientes", () => {
  const r = report("full", 9);
  const time = r.createdAt!;
  expect(isRecent(r, time + 3600000)).toBe(true);
  expect(isRecent(r, time + 3600001)).toBe(false);
  expect(isRecent({ ...r, createdAt: null })).toBe(false);
  expect(ageLabel(null)).toBe("Sin fecha confirmada");
  expect(ageLabel(time, time + 120000)).toBe("Hace 2 min");
});
test("promedia por horario colombiano y no inventa valores en franjas vacías", () => {
  expect(
    summarize([report("empty", 6), report("full", 11), report("full", 18)]).map(
      (b) => [b.count, b.level],
    ),
  ).toEqual([
    [2, "medium"],
    [0, null],
    [1, "full"],
  ]);
  expect(summarize([]).every((b) => b.level === null)).toBe(true);
});
