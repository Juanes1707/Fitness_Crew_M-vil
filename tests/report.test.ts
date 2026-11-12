import { publishReport, photoUrl } from "../backend/services/reportService";
import { PendingReport } from "../backend/types";
import * as FileSystem from "expo-file-system/legacy";
import { clearPhotoUrlCache } from "../backend/services/photoService";
const mockRead = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpload = jest.fn();
const mockSignedUrl = jest.fn();
const mockSession = jest.fn();
const mockTable = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: mockRead,
  single: mockSingle,
  insert: mockInsert,
};
jest.mock("../backend/services/supabase", () => ({
  backend: () => ({
    auth: { getSession: mockSession },
    from: () => mockTable,
    storage: {
      from: () => ({ upload: mockUpload, createSignedUrl: mockSignedUrl }),
    },
  }),
}));
jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: "base64" },
}));
const pending: PendingReport = {
  id: "r",
  userId: "u",
  gymId: "g",
  level: "medium",
  photoUri: "file:///photo.jpg",
  capturedAt: 1,
};
beforeEach(() => {
  clearPhotoUrlCache();
  mockSession.mockResolvedValue({
    data: { session: { user: { id: "u" } } },
    error: null,
  });
  mockRead.mockResolvedValue({ data: null, error: null });
  mockUpload.mockResolvedValue({ error: null });
  mockInsert.mockResolvedValue({ error: null });
  jest.mocked(FileSystem.readAsStringAsync).mockResolvedValue("/9j/");
});

test("abrir la misma foto varias veces comparte una sola petición de URL firmada", async () => {
  mockSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://example.test/cached" },
    error: null,
  });
  const result = await Promise.all([
    photoUrl("u/same.jpg"),
    photoUrl("u/same.jpg"),
    photoUrl("u/same.jpg"),
  ]);
  expect(result).toEqual(Array(3).fill("https://example.test/cached"));
  await photoUrl("u/same.jpg");
  expect(mockSignedUrl).toHaveBeenCalledTimes(1);
});
test("sube ArrayBuffer antes de insertar reporte sin fecha controlada por cliente", async () => {
  await publishReport(pending);
  expect(mockUpload).toHaveBeenCalledWith("u/r.jpg", expect.any(ArrayBuffer), {
    contentType: "image/jpeg",
    upsert: false,
  });
  expect(mockInsert).toHaveBeenCalledWith({
    id: "r",
    gym_id: "g",
    user_id: "u",
    level: "medium",
    photo_path: "u/r.jpg",
  });
  expect(mockUpload.mock.invocationCallOrder[0]).toBeLessThan(
    mockInsert.mock.invocationCallOrder[0],
  );
});
test("un fallo de foto no publica un reporte incompleto", async () => {
  mockUpload.mockResolvedValueOnce({
    error: { message: "Network request failed" },
  });
  await expect(publishReport(pending)).rejects.toMatchObject({
    message: "Network request failed",
  });
  expect(mockInsert).not.toHaveBeenCalled();
});
test("un reporte confirmado no se duplica ni vuelve a subir foto", async () => {
  mockRead.mockResolvedValueOnce({
    data: { id: "r", user_id: "u", gym_id: "g" },
    error: null,
  });
  await publishReport(pending);
  expect(mockUpload).not.toHaveBeenCalled();
  expect(mockInsert).not.toHaveBeenCalled();
});
test("reutiliza foto ya subida al recibir conflicto 409", async () => {
  mockUpload.mockResolvedValueOnce({
    error: { statusCode: "409", message: "The resource already exists" },
  });
  await publishReport(pending);
  expect(mockInsert).toHaveBeenCalledTimes(1);
});
test("no publica datos incompletos ni pendientes de otra cuenta", async () => {
  await expect(publishReport({ ...pending, gymId: "" })).rejects.toThrow(
    "Selecciona",
  );
  await expect(publishReport({ ...pending, userId: "other" })).rejects.toThrow(
    "cuenta",
  );
  expect(mockInsert).not.toHaveBeenCalled();
});
test("un fallo de escritura se propaga para conservar el pendiente", async () => {
  mockInsert.mockResolvedValueOnce({ error: { code: "42501" } });
  await expect(publishReport(pending)).rejects.toMatchObject({ code: "42501" });
});
test("rechaza imagen vacía antes de subir", async () => {
  jest.mocked(FileSystem.readAsStringAsync).mockResolvedValueOnce("");
  await expect(publishReport(pending)).rejects.toThrow("fotografía");
  expect(mockUpload).not.toHaveBeenCalled();
});
test("un reintento simultáneo comprueba que el conflicto pertenece al mismo reporte", async () => {
  mockInsert.mockResolvedValueOnce({ error: { code: "23505" } });
  mockSingle.mockResolvedValueOnce({
    data: { user_id: "u", gym_id: "g" },
    error: null,
  });
  await expect(publishReport(pending)).resolves.toBeUndefined();
});
test("el ID de otro autor no se acepta como publicación propia", async () => {
  mockRead.mockResolvedValueOnce({
    data: { id: "r", user_id: "other", gym_id: "g" },
    error: null,
  });
  await expect(publishReport(pending)).rejects.toThrow("otro reporte");
  expect(mockUpload).not.toHaveBeenCalled();
});
test("las fotos usan URL firmada y propagan los errores de acceso", async () => {
  mockSignedUrl.mockResolvedValueOnce({
    data: { signedUrl: "https://example.test/signed" },
    error: null,
  });
  await expect(photoUrl("u/r.jpg")).resolves.toBe(
    "https://example.test/signed",
  );
  expect(mockSignedUrl).toHaveBeenCalledWith("u/r.jpg", 3600);
  mockSignedUrl.mockResolvedValueOnce({ data: null, error: { status: 403 } });
  clearPhotoUrlCache();
  await expect(photoUrl("u/r.jpg")).rejects.toEqual({ status: 403 });
});

test("la firma se renueva antes de vencer y después de cambiar sesión", async () => {
  const now = jest.spyOn(Date, "now").mockReturnValue(1000);
  mockSignedUrl.mockResolvedValue({
    data: { signedUrl: "https://example.test/firma" },
    error: null,
  });
  try {
    await photoUrl("u/expires.jpg");
    now.mockReturnValue(1000 + 50 * 60 * 1000);
    await photoUrl("u/expires.jpg");
    clearPhotoUrlCache();
    await photoUrl("u/expires.jpg");
    expect(mockSignedUrl).toHaveBeenCalledTimes(3);
  } finally {
    now.mockRestore();
  }
});

test("un error de firma no queda en caché y permite reintentar", async () => {
  mockSignedUrl
    .mockResolvedValueOnce({ data: null, error: { status: 403 } })
    .mockResolvedValueOnce({
      data: { signedUrl: "https://example.test/retry" },
      error: null,
    });
  await expect(photoUrl("u/retry.jpg")).rejects.toEqual({ status: 403 });
  await expect(photoUrl("u/retry.jpg")).resolves.toBe(
    "https://example.test/retry",
  );
  expect(mockSignedUrl).toHaveBeenCalledTimes(2);
});
