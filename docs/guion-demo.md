# Guion de presentación y demo FitCrew

Material de preparación; no evidencia de ensayo ni presentación ya realizada. Ajustar duración al bloque que confirme el profesor: el PDF no especifica minutos.

1. Presentar problema, propósito y límites: ocupación colaborativa con fecha y foto; ausencia de reportes se muestra como ausencia de información. Incorporar personas, competidores y brechas cuando el equipo aporte Fase 1.
2. Mostrar arquitectura del informe: UI/Expo Router, Redux, servicios directos, Supabase Auth/PostgreSQL/Storage/Realtime y RLS. Explicar que backend/ contiene servicios cliente y SQL, no otro servidor Node.
3. Abrir el catálogo real, buscar un gimnasio y consultar último reporte/historial. Preparar cuentas y conectividad antes de la sesión. No presentar información ficticia como real.
4. Reportar desde un piloto con información real o entorno de prueba autorizado. Seleccionar gimnasio/nivel, capturar sin rostros, confirmar y observar desde la segunda cuenta. Explicar fecha del servidor e ID estable para reintentos.
5. Mostrar grupo privado y check-in, sólo si el flujo E2E fue aprobado antes del ensayo. Explicar membresía e invitación. No simular éxito si falta validación.
6. Mostrar TalkBack en acción, etiquetas/estados, tema y texto ampliado sin recortes. Ensayar gestos de lector previamente. Una captura de código no sustituye la demostración accesible.
7. Cerrar con resultados reales de pruebas y límites pendientes. No confundir 87 pruebas Jest y 7 SQL con 94 pruebas físicas.

## Ensayo individual (40% de la rúbrica)

Cada integrante debe poder ubicar y explicar, sin que otro responda:

- `_layout.tsx`: Provider, observación de sesión, rutas protegidas y limpieza.
- Store/slices: qué estado es global y qué permanece local.
- `supabase.ts`/`sessionStorage.ts`: clave pública, RLS, persistencia cifrada, migración, renovación y salida.
- `report.tsx`/`reportService.ts`: permiso, cámara, copia local, subida, confirmación, timeout y reintento estable.
- `gym/[id].tsx`/`occupancy.ts`: carga/error/vacío, vigencia y resumen histórico sin predicción.
- `friends.tsx` y SQL: membresía desconocida frente a grupo inexistente, RPC y privacidad.
- `ui.tsx`: Pressable, roles, labels/hints/state, lineHeight, mínimos táctiles y tema.

Ejercicio: proponer un ajuste pequeño, ubicar el archivo, explicar el efecto, hacerlo y ejecutar la prueba afectada. La práctica y las contribuciones deben ser reales; ninguna guía acredita autoría por sí sola.
