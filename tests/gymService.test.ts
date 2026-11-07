import { watchGyms, watchReports } from "../backend/services/gymService";
const mockWatch = jest.fn();
const mockResult = jest.fn();
const mockQuery = {
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: (resolve: (value: unknown) => void) => mockResult().then(resolve),
};
jest.mock("../backend/services/supabase", () => ({
  backend: () => ({ from: jest.fn(() => mockQuery) }),
}));
jest.mock("../backend/services/watchQuery", () => ({
  watchQuery: (...args: unknown[]) => mockWatch(...args),
}));
test("gimnasios se consultan en Supabase sin catálogo local", async () => {
  const rows = [{ id: "g", name: "Gimnasio", address: "Campus" }];
  mockResult.mockResolvedValueOnce({ data: rows, error: null });
  watchGyms(jest.fn(), jest.fn());
  const load = mockWatch.mock.calls[0][1];
  await expect(load()).resolves.toEqual(rows);
  expect(mockQuery.order).toHaveBeenCalledWith("name");
});
test("historial transforma timestamps, filtra gimnasio y limita a 100", async () => {
  mockResult.mockResolvedValueOnce({
    data: [
      {
        id: "r",
        gym_id: "g",
        user_id: "u",
        level: "full",
        photo_path: "u/r.jpg",
        created_at: "2026-11-07T15:00:00Z",
      },
    ],
    error: null,
  });
  watchReports("g", jest.fn(), jest.fn());
  const load = mockWatch.mock.calls[0][1];
  await expect(load()).resolves.toEqual([
    {
      id: "r",
      gymId: "g",
      userId: "u",
      level: "full",
      photoPath: "u/r.jpg",
      createdAt: Date.parse("2026-11-07T15:00:00Z"),
    },
  ]);
  expect(mockQuery.eq).toHaveBeenCalledWith("gym_id", "g");
  expect(mockQuery.limit).toHaveBeenCalledWith(100);
  expect(mockWatch.mock.calls[0][4]).toBe("gym_id=eq.g");
});
test("los errores de consulta no se convierten en resultados vacíos", async () => {
  mockResult.mockResolvedValueOnce({ data: null, error: { code: "PGRST205" } });
  watchGyms(jest.fn(), jest.fn());
  await expect(mockWatch.mock.calls[0][1]()).rejects.toEqual({
    code: "PGRST205",
  });
});
