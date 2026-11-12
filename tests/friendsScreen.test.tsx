import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import Friends from "../frontend/app/(tabs)/friends";
import { makeStore, renderApp } from "./helpers/renderApp";
import { sessionChanged } from "../frontend/src/store/slices/authSlice";
import { gymsReceived } from "../frontend/src/store/slices/gymSlice";
import {
  getGroupId,
  createGroup,
  joinGroup,
  checkIn,
  watchGroup,
  watchCheckIns,
} from "../backend/services/friendService";
jest.mock("../backend/services/friendService", () => ({
  getGroupId: jest.fn(),
  createGroup: jest.fn(),
  joinGroup: jest.fn(),
  checkIn: jest.fn(),
  watchGroup: jest.fn(),
  watchCheckIns: jest.fn(),
}));
const stopGroup = jest.fn();
const stopActivity = jest.fn();
const user = { uid: "u", name: "Crew", email: "test@example.invalid" };
beforeEach(() => {
  jest.mocked(getGroupId).mockResolvedValue(undefined);
  jest.mocked(watchGroup).mockImplementation((_id, next) => {
    next({ id: "g", name: "Grupo de prueba", members: ["u"], ownerId: "u" });
    return stopGroup;
  });
  jest.mocked(watchCheckIns).mockImplementation((_id, next) => {
    next([]);
    return stopActivity;
  });
});
async function open() {
  const store = makeStore();
  store.dispatch(sessionChanged(user));
  store.dispatch(
    gymsReceived([
      { id: "gym", name: "Gimnasio de prueba", address: "Dirección" },
    ]),
  );
  return renderApp(<Friends />, store);
}
test("fallo de membresía no ofrece crear o unirse como si no existiera grupo; permite recuperar", async () => {
  jest.mocked(getGroupId).mockRejectedValueOnce(new Error("No hay conexión"));
  await open();
  expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión");
  expect(
    screen.queryByRole("button", { name: "Crear grupo privado" }),
  ).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Volver a cargar grupo" }),
  );
  expect(
    await screen.findByRole("button", { name: "Crear grupo privado" }),
  ).toBeTruthy();
});
test("creación carga grupo real del servicio, actividad vacía y limpia suscripciones", async () => {
  jest.mocked(createGroup).mockResolvedValueOnce("g");
  const view = await open();
  await fireEvent.changeText(
    await screen.findByLabelText("Nombre del grupo"),
    "Mi crew",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Crear grupo privado" }),
  );
  expect(await screen.findByText("Grupo de prueba")).toBeTruthy();
  expect(createGroup).toHaveBeenCalledWith("Mi crew");
  expect(screen.getByText("Aún no hay check-ins compartidos.")).toBeTruthy();
  await view.unmount();
  expect(stopGroup).toHaveBeenCalled();
  expect(stopActivity).toHaveBeenCalled();
});
test("error de invitación se muestra sin inventar membresía", async () => {
  jest.mocked(joinGroup).mockRejectedValueOnce(new Error("Código inválido"));
  await open();
  await fireEvent.changeText(
    await screen.findByLabelText("Código de invitación"),
    "incorrecto",
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Unirme al grupo" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Código inválido");
  expect(watchGroup).not.toHaveBeenCalled();
});
test("check-in recibe gimnasio y cuenta actual y comunica confirmación", async () => {
  jest.mocked(getGroupId).mockResolvedValueOnce("g");
  jest.mocked(checkIn).mockResolvedValueOnce(undefined);
  await open();
  await screen.findByText("Grupo de prueba");
  await fireEvent.press(
    screen.getByRole("button", { name: "Gimnasio de prueba" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Registrar mi check-in" }),
  );
  await waitFor(() => expect(checkIn).toHaveBeenCalledWith("g", "gym", user));
  expect(
    await screen.findByText("Check-in compartido con tu crew."),
  ).toBeTruthy();
});
