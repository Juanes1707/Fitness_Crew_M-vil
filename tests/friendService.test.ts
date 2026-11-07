import {
  createGroup,
  joinGroup,
  checkIn,
} from "../backend/services/friendService";
const mockRpc = jest.fn();
const mockInsert = jest.fn();
jest.mock("../backend/services/supabase", () => ({
  backend: () => ({ rpc: mockRpc, from: () => ({ insert: mockInsert }) }),
}));
test("valida invitación y nombre antes de llamar al servidor", async () => {
  await expect(createGroup(" ")).rejects.toThrow("nombre");
  await expect(joinGroup("incorrecto")).rejects.toThrow("código");
  expect(mockRpc).not.toHaveBeenCalled();
});
test("crear grupo usa una transacción del servidor sin aceptar identidad cliente", async () => {
  mockRpc.mockResolvedValueOnce({ data: "id", error: null });
  await expect(createGroup(" Crew ")).resolves.toBe("id");
  expect(mockRpc).toHaveBeenCalledWith("create_group", { p_name: "Crew" });
});
test("incorporación por invitación usa RPC y propaga falta de cupo", async () => {
  mockRpc.mockResolvedValueOnce({
    data: null,
    error: { code: "P0001", message: "El grupo ya tiene 20 integrantes." },
  });
  await expect(
    joinGroup("11111111-1111-4111-8111-111111111111"),
  ).rejects.toMatchObject({ code: "P0001" });
  expect(mockRpc).toHaveBeenCalledWith("join_group", {
    p_code: "11111111-1111-4111-8111-111111111111",
  });
});
test("check-in envía autor y gimnasio pero no una fecha fabricada", async () => {
  const user = { uid: "u", name: "Crew", email: "a@example.com" };
  await expect(checkIn("g", "", user)).rejects.toThrow("Selecciona");
  mockInsert.mockResolvedValueOnce({ error: null });
  await checkIn("g", "gym", user);
  expect(mockInsert).toHaveBeenCalledWith({
    group_id: "g",
    user_id: "u",
    name: "Crew",
    gym_id: "gym",
  });
});
