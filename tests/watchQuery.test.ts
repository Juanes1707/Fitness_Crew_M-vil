import { watchQuery } from "../backend/services/watchQuery";
const mockRemove = jest.fn().mockResolvedValue(undefined);
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
};
jest.mock("../backend/services/supabase", () => ({
  backend: () => ({ channel: () => mockChannel, removeChannel: mockRemove }),
}));
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});
test("consulta inicialmente, al cambiar datos y al recuperar la suscripción; cancela al salir", async () => {
  const load = jest.fn().mockResolvedValue(["dato"]);
  const next = jest.fn();
  const fail = jest.fn();
  const stop = watchQuery("gyms", load, next, fail);
  await jest.advanceTimersByTimeAsync(0);
  expect(next).toHaveBeenCalledWith(["dato"]);
  const onChange = mockChannel.on.mock.calls[0][2];
  onChange();
  await jest.advanceTimersByTimeAsync(0);
  const onStatus = mockChannel.subscribe.mock.calls[0][0];
  onStatus("SUBSCRIBED");
  await jest.advanceTimersByTimeAsync(0);
  expect(load).toHaveBeenCalledTimes(3);
  stop();
  await jest.advanceTimersByTimeAsync(30000);
  expect(load).toHaveBeenCalledTimes(3);
  expect(mockRemove).toHaveBeenCalled();
  expect(fail).not.toHaveBeenCalled();
});
test("un error de red se comunica y el siguiente refresco recupera datos", async () => {
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error("Sin red"))
    .mockResolvedValue(["recuperado"]);
  const next = jest.fn();
  const fail = jest.fn();
  const stop = watchQuery("reports", load, next, fail, "gym_id=eq.g");
  await jest.advanceTimersByTimeAsync(0);
  expect(fail).toHaveBeenCalledWith(
    expect.objectContaining({ message: "Sin red" }),
  );
  await jest.advanceTimersByTimeAsync(30000);
  expect(next).toHaveBeenCalledWith(["recuperado"]);
  stop();
});
