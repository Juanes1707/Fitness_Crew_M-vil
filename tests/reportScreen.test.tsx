import React from "react";
import { act, fireEvent, screen } from "@testing-library/react-native";
import ReportScreen from "../frontend/app/(tabs)/report";
import { renderApp, makeStore } from "./helpers/renderApp";
import { sessionChanged } from "../frontend/src/store/slices/authSlice";
import { gymsReceived } from "../frontend/src/store/slices/gymSlice";
import {
  loadPending,
  savePending,
  removePending,
} from "../backend/services/pendingService";
import { publishReport } from "../backend/services/reportService";
import { PendingReport } from "../backend/types";
const mockRequest = jest.fn();
const mockPicture = jest.fn();
const mockSetParams = jest.fn();
let mockPermission = { granted: true, canAskAgain: true };
let mockBlur: (() => void) | undefined;
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ gymId: "campus" }),
  useRouter: () => ({ setParams: mockSetParams }),
  useFocusEffect: (effect: () => (() => void) | void) => {
    const React = jest.requireActual<typeof import("react")>("react");
    React.useEffect(() => {
      mockBlur = effect() || undefined;
      return mockBlur;
    }, [effect]);
  },
}));
jest.mock("expo-camera", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return {
    useCameraPermissions: () => [mockPermission, mockRequest],
    CameraView: React.forwardRef<unknown, object>(
      function MockCamera(props, ref) {
        React.useImperativeHandle(ref, () => ({
          takePictureAsync: mockPicture,
        }));
        return React.createElement(View, {
          ...props,
          testID: "camera-preview",
        });
      },
    ),
  };
});
jest.mock("expo-crypto", () => ({ randomUUID: () => "reporte-estable" }));
jest.mock("../backend/services/pendingService", () => ({
  loadPending: jest.fn(),
  savePending: jest.fn(),
  removePending: jest.fn(),
}));
jest.mock("../backend/services/reportService", () => ({
  publishReport: jest.fn(),
}));
jest.setTimeout(15000);
const saved: PendingReport = {
  id: "reporte-estable",
  userId: "u",
  gymId: "campus",
  level: "medium",
  photoUri: "file:///documents/foto.jpg",
  capturedAt: 1,
};
beforeEach(() => {
  mockPermission = { granted: true, canAskAgain: true };
  mockBlur = undefined;
  mockPicture.mockResolvedValue({ uri: "file:///cache/foto.jpg" });
  jest.mocked(loadPending).mockResolvedValue([]);
  jest.mocked(savePending).mockResolvedValue(saved);
  jest.mocked(removePending).mockResolvedValue(undefined);
  jest.mocked(publishReport).mockResolvedValue(undefined);
});
async function openScreen() {
  const store = makeStore();
  store.dispatch(
    sessionChanged({ uid: "u", name: "Crew", email: "crew@example.com" }),
  );
  store.dispatch(
    gymsReceived([
      { id: "campus", name: "Gimnasio Campus", address: "Dirección de prueba" },
    ]),
  );
  return renderApp(<ReportScreen />, store);
}
async function takePhoto() {
  await fireEvent.press(screen.getByRole("button", { name: "Abrir cámara" }));
  await fireEvent(screen.getByTestId("camera-preview"), "cameraReady");
  await fireEvent.press(
    screen.getByRole("button", { name: "Tomar fotografía" }),
  );
}
test("permiso denegado informa el problema y no monta la cámara", async () => {
  mockPermission = { granted: false, canAskAgain: true };
  mockRequest.mockResolvedValueOnce({ granted: false, canAskAgain: true });
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Abrir cámara" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "La cámara necesita permiso. Puedes habilitarlo en los ajustes del dispositivo.",
  );
  expect(screen.queryByTestId("camera-preview")).toBeNull();
  expect(mockPicture).not.toHaveBeenCalled();
});
test("un formulario incompleto no publica ni guarda un pendiente", async () => {
  await openScreen();
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar y publicar" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Selecciona un gimnasio, un nivel y toma una fotografía.",
  );
  expect(savePending).not.toHaveBeenCalled();
  expect(publishReport).not.toHaveBeenCalled();
});
test("captura, confirma y publica sólo después de guardar una copia durable", async () => {
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "◐ Medio" }));
  await takePhoto();
  expect(
    screen.getByLabelText("Vista previa de la fotografía que vas a publicar"),
  ).toBeTruthy();
  expect(publishReport).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar y publicar" }),
  );
  expect(
    await screen.findByText("Reporte publicado. Gracias por compartir."),
  ).toBeTruthy();
  expect(savePending).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "reporte-estable",
      gymId: "campus",
      userId: "u",
      level: "medium",
      photoUri: "file:///cache/foto.jpg",
    }),
  );
  expect(publishReport).toHaveBeenCalledWith(saved);
  expect(removePending).toHaveBeenCalledWith(saved);
  expect(jest.mocked(savePending).mock.invocationCallOrder[0]).toBeLessThan(
    jest.mocked(publishReport).mock.invocationCallOrder[0],
  );
});
test("si falla la publicación conserva el pendiente y permite reintentar con el mismo ID", async () => {
  jest.mocked(loadPending).mockResolvedValueOnce([]).mockResolvedValue([saved]);
  jest.mocked(publishReport).mockRejectedValueOnce(new Error("Sin conexión"));
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "◐ Medio" }));
  await takePhoto();
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar y publicar" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
  expect(removePending).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Reintentar publicación" }),
  );
  expect(await screen.findByText("Reporte publicado.")).toBeTruthy();
  expect(publishReport).toHaveBeenNthCalledWith(2, saved);
});
test("abandonar la pestaña libera la vista previa de cámara", async () => {
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Abrir cámara" }));
  expect(screen.getByTestId("camera-preview")).toBeTruthy();
  await act(async () => {
    mockBlur?.();
  });
  expect(screen.queryByTestId("camera-preview")).toBeNull();
});
test("si falla el guardado local conserva la foto del formulario y no publica", async () => {
  jest
    .mocked(savePending)
    .mockRejectedValueOnce(new Error("No se pudo guardar la foto"));
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "◐ Medio" }));
  await takePhoto();
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar y publicar" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No se pudo guardar la foto",
  );
  expect(
    screen.getByLabelText("Vista previa de la fotografía que vas a publicar"),
  ).toBeTruthy();
  expect(publishReport).not.toHaveBeenCalled();
});
test("un permiso bloqueado ofrece abrir los ajustes", async () => {
  mockPermission = { granted: false, canAskAgain: false };
  await openScreen();
  expect(
    screen.getByRole("button", { name: "Abrir ajustes de permisos" }),
  ).toBeTruthy();
});
test("no permite capturar antes de que la cámara esté lista", async () => {
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "Abrir cámara" }));
  const capture = screen.getByRole("button", { name: "Tomar fotografía" });
  expect(capture).toBeDisabled();
  await fireEvent.press(capture);
  expect(mockPicture).not.toHaveBeenCalled();
});
test("el selector de gimnasio se anuncia deshabilitado durante la publicación", async () => {
  let finish!: () => void;
  jest.mocked(publishReport).mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await openScreen();
  await fireEvent.press(screen.getByRole("button", { name: "◐ Medio" }));
  await takePhoto();
  await fireEvent.press(
    screen.getByRole("button", { name: "Confirmar y publicar" }),
  );
  try {
    expect(
      screen.getByRole("button", { name: "Gimnasio Campus" }),
    ).toBeDisabled();
  } finally {
    await act(async () => {
      finish();
    });
  }
});
