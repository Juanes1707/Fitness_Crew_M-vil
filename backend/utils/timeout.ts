export async function withTimeout<T>(work: Promise<T>, ms = 20000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "El servicio tarda en responder. Revisa la conexión y reintenta. Si guardaste un reporte, permanece pendiente.",
              ),
            ),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
