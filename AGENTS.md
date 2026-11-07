# FitCrew

Aplicación académica mínima. Mantener Expo SDK 58 compatible con Expo Go 58, TypeScript, Expo Router, Redux Toolkit y Supabase JS SDK. Usar StyleSheet y servicios directos, sin capas adicionales. El usuario autorizó migrar de Firebase a Supabase; Firebase no es requisito del profesor.

No simular datos en producción. No publicar reglas ni desplegar sin autorización. No incluir secretos de servidor. Documentar verificaciones pendientes con honestidad.

Antes de entregar ejecutar `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:security` y `npm run check:expo`. Las políticas SQL se prueban con PostgreSQL embebido; documentar por separado las verificaciones en Supabase real y Expo Go.
