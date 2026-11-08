# FitCrew

Aplicación académica mínima. Mantener Expo SDK 58 compatible con Expo Go 58, TypeScript, Expo Router, Redux Toolkit y Supabase JS SDK. Usar StyleSheet y servicios directos, sin capas adicionales. El usuario autorizó migrar de Firebase a Supabase; Firebase no es requisito del profesor.

No simular datos en producción. No publicar reglas ni desplegar sin autorización. No incluir secretos de servidor. Documentar verificaciones pendientes con honestidad.

Antes de entregar ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:security` y `npm run check:expo`. Las políticas SQL se prueban con PostgreSQL embebido; documentar por separado las verificaciones en Supabase real y Expo Go.

## Continuidad y traspaso

Leer primero [docs/CONTEXTO-TRASPASO.md](docs/CONTEXTO-TRASPASO.md). Consolida decisiones autorizadas, arquitectura, configuración existente, correcciones, evidencia, comandos y pendientes. Consultar sólo el código pertinente a la tarea; no reiniciar el análisis ni reconstruir lo implementado.

- Supabase ya está configurado y los tres gimnasios reales cargados por el usuario. No recrear el proyecto, volver a Firebase, sobrescribir `.env` ni reejecutar SQL remoto por rutina.
- El 7 de noviembre de 2026 pasaron 73 pruebas Jest, 7 SQL, typecheck, lint y check:expo. Bundle Android/iOS/web y Expo Doctor también tienen evidencia histórica; ver fechas y alcance en la guía.
- Android físico ya comprobado: Samsung SM-A566E / Android 16 / Expo Go 58.0.5; acceso, catálogo, búsqueda/detalle, persistencia de sesión, captura/vista previa y liberación de cámara, listado claro/oscuro y corrección de pestañas al 200%. Registro: [docs/prueba-android-usb.md](docs/prueba-android-usb.md).
- No repetir pruebas físicas aprobadas sólo para recuperar contexto. Repetirlas si cambia el flujo/configuración/entorno o aparece una regresión. Esto no elimina las comprobaciones locales obligatorias antes de entregar.
- Pendientes: publicación real y segunda cuenta, cola sin conexión, grupos E2E, rechazo/bloqueo físico de permisos, TalkBack/VoiceOver y revisión completa de tamaños/rotación. No publicar ocupación ficticia en los gimnasios reales para cerrar pruebas.
- Mantener esta guía y el progreso actualizados. No interpretar como pendientes actuales las notas históricas anteriores a la validación USB.
