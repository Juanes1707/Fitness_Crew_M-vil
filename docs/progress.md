# FitCrew — avance de desarrollo y QA

## 12 de noviembre — carga de fotografías

El usuario aclaró que publicar funciona; se retiraron los cuatro archivos del cambio incompleto de publicación y se abordó sólo carga de fotos. ReportPhoto ahora usa expo-image (SDK 58), caché memoria/disco y clave estable; URL firmada reutilizada durante 50 minutos con deduplicación y limpieza de sesión; foto principal prioritaria e históricas bajo demanda. Regresión observada: cuatro firmas para un mismo path antes; una después. Pasaron 90 pruebas de aplicación, 7 SQL, typecheck, lint y check:expo. Empaquetado de cierre registrado en verificacion.md. No hay medición física de latencia; no se tocó Storage remoto ni se recomprimieron fotos existentes. Detalle en carga-imagenes.md.

## Actualización del 12 de noviembre — Expo y ngrok

Expo 58.0.24 y seis paquetes asociados alineados; Crypto y SecureStore también actualizados en backend para mantener versiones nativas únicas. Se instaló @expo/ngrok 4.1.3 local y se añadió `npm run start:tunnel` con proveedor ngrok explícito. Pasaron typecheck, lint, 87 pruebas de aplicación, 7 SQL y check:expo. Ngrok informa connected/ready; Metro local en 8082 responde y genera URL pública, pero la consulta externa desde este equipo falla (HTTPS ECONNRESET / HTTP 503). Comprobación desde otra red solicitada al usuario; no marcarla aprobada sin resultado. Detalle: iniciar-tunnel.md. No se modificaron .env ni SQL remoto ni datos del usuario.

## Actualización del 9 de noviembre

Resultados adicionales de cierre: anuncio de Ver Athletic Gym Chía confirmado por el usuario con TalkBack (parcial); cola sin Internet guardó 1/5, recuperó foto/metadatos tras force-stop y permitió eliminar hasta 0/5 antes de restaurar red. No se subió ninguna foto. El usuario aclaró que no estaba en Athletic; no usar la captura de escritorio como reporte real. Datos móviles y ajustes de accesibilidad restaurados; catálogo vuelve a cargar. Reintento/deduplicación remotos, cambio de cuenta, grupos y auditoría completa siguen pendientes.

Resultado físico posterior: ADB finalmente detectó el A56. Con el storage nuevo, sesión preexistente conservada al abrir, persistencia tras force-stop y cierre de sesión persistente después de reiniciar comprobados. Ver prueba-sesion-segura-android.md. La nota de bloqueo USB inferior es histórica y quedó resuelta. Se solicitó nuevo acceso directo al usuario para continuar; renovación forzada nativa, publicación/grupos/offline y auditoría completa siguen pendientes.

Se implementó almacenamiento de sesión nativo protegido con SecureStore, migración desde AsyncStorage y soporte de sesiones grandes; web mantiene storage estándar. Diez pruebas nuevas incluyen ciclo Auth con SDK real y red simulada, fallos de migración/escritura, renovación, salida y corrupción. Cuatro pruebas de pantalla Mi crew reprodujeron/cubren un fallo: consulta de membresía fallida ofrecía crear/unirse como si no hubiera grupo; ahora exige recuperación antes de continuar. No se modificó SQL remoto ni el flujo de publicación existente.

Pasaron 14 suites/87 pruebas Jest, 7 SQL, typecheck, lint limpio, check:expo, bundle Android/iOS/web y smoke remoto sin escrituras. Instalación de SecureStore compatible SDK 58, dependencias explícitas en frontend/backend y plugin registrado. Informe actualizado con rúbrica real, almacenamiento seguro, evidencia física histórica y bibliografía APA. Se añadieron estado-rubrica.md y guion-demo.md. No se inventaron personas/competidores de Fase 1 ni compromisos de Fase 2, aún ausentes.

Bloqueo físico actual: ADB lista vacía incluso tras reinicio; Windows sólo identifica el A56 por Bluetooth. El usuario está revisando el cable USB-C. Próximo paso: verificar migración de la sesión existente sin borrar datos, reinicio, renovación y cierre en Android; después publicación real/segunda cuenta, grupos, offline y TalkBack. La evidencia del día 7 sigue siendo histórica y no valida automáticamente el nuevo storage. Las tablas inferiores corresponden al cierre previo.

Actualizado el 8 de noviembre de 2026, America/Bogota. Estado: implementación del MVP revisada y verificada localmente; validación Android parcial ejecutada por USB el 7 de noviembre. Leer primero [CONTEXTO-TRASPASO.md](CONTEXTO-TRASPASO.md). Evidencia física en [prueba-android-usb.md](prueba-android-usb.md).

El usuario confirmó **conservar Supabase**. Las referencias a Firebase de la plantilla se corresponden con Supabase Auth, PostgreSQL, Storage y Realtime. Se mantuvieron Expo SDK 58, TypeScript, Redux Toolkit/React Redux, las carpetas frontend/backend y las dependencias existentes.

No se encontraron los PDF de propuesta, rúbrica Fase 3, accesibilidad Fase 2 ni un documento independiente de arquitectura. Se usaron el código, README, informe y requisitos del usuario. La carpeta no tiene repositorio Git; no se fabricaron historial ni contribuciones.

## Estado por funcionalidad

| Funcionalidad | Estado verificable | Evidencia / pendiente |
|---|---|---|
| Expo y navegación | Implementado y probado localmente | Rutas protegidas, acceso, listado, detalle, pestañas y cierre de sesión; empaquetado final registrado abajo |
| React Redux | Implementado y probado integrado | El recorrido usa el store real; al cerrar sesión limpia perfil, gimnasios y suscripciones |
| Autenticación | Pruebas locales y comprobaciones remotas/físicas aprobadas | Usuario creó cuenta e inició sesión; catálogo autenticado y persistencia tras force-stop Android observados. Rechazo HTTP incorrecto probado; cierre de sesión cubierto por navegación integrada |
| Gimnasios y búsqueda | Implementado; servicios y pantalla probados | Tres pilotos cargados por el usuario; pruebas de búsqueda, catálogo vacío, carga e ID inexistente |
| Reportes y cámara | Implementado; pruebas locales y captura física aprobadas | Sensor, captura, vista previa y liberación comprobados en Android. Rechazo/bloqueo físico de permisos y publicación remota real pendientes |
| Ocupación e historial | Implementado y probado localmente | Último reporte, fotografía, historial, vigencia, resumen y distinción entre carga/error/vacío |
| Amigos y privacidad | Implementado; servicios y RLS probados | RPC, membresía, cupo y check-ins en PostgreSQL embebido. Dos cuentas reales pendientes |
| Pendientes | Implementado y probado localmente | Copia antes de publicar, límite, escritura/lectura, separación por UID y conservación ante error. Corte/reinicio físico pendiente |
| Accesibilidad | Implementado y parcialmente validado | Etiquetas, roles, estados, contraste y Button 50×50 automáticos. Listado claro/oscuro y pestañas al 200% revisados; recorte corregido. TalkBack/VoiceOver y revisión completa pendientes |
| Documentación | Actualizada | README, informe de cinco secciones, matriz, pruebas manuales, guia-defensa.md y este registro |

## Problemas detectados y correcciones aplicadas

1. **Detalle mostraba inexistente/vacío antes de terminar la consulta.** En `frontend/app/gym/[id].tsx` se separaron carga del catálogo, ID inexistente, carga de reportes, error y vacío confirmado. Tres pruebas reprodujeron el fallo antes del cambio y pasaron después.
2. **La cámara seguía montada al abandonar la pestaña.** En `frontend/app/(tabs)/report.tsx` se libera la vista previa y su estado de preparación con `useFocusEffect`. Prueba de pérdida de foco aprobada después de fallar inicialmente.
3. **Bucle al cerrar sesión desde una ruta privada en SDK 58.** En `frontend/app/_layout.tsx` se añadió `redirectTo="/login"` a la protección privada. La prueba integrada aisló el fallo al cerrar sesión y ahora completa el recorrido sin bucles. No se aumentó la memoria de Node para ocultarlo.
4. **Ancho táctil mínimo no garantizado para etiquetas cortas.** `frontend/src/components/ui.tsx` define mínimo 50×50. La prueba del contrato mínimo 48 en ambos ejes falló antes y pasó después.
5. **Selector sin estado disabled durante operaciones.** `GymPicker.tsx` recibe disabled; Reportar y Mi crew lo activan mientras trabajan. La prueba durante una publicación diferida ahora pasa.
6. **Pestañas recortadas con texto al 200%.** La prueba física reprodujo el fallo; se ajustaron altura según fontScale/safe area, etiquetas multilínea e iconos decorativos sin escalado. Capturas antes/después en el registro USB.

Se añadieron `tests/gymScreens.test.tsx`, `tests/reportScreen.test.tsx`, `tests/navigation.test.tsx` y el helper de render con los reducers reales. Se ampliaron `tests/accessibility.test.tsx` y `tests/pending.test.ts`. La prueba de navegación falla rápidamente si reaparece recursión de renders. No se quitaron pruebas ni quedaron registros temporales de diagnóstico.

`backend/scripts/check-connection.mjs` y el comando `test:backend` comprueban conectividad, grants anónimos y credenciales incorrectas sin crear usuarios, enviar correos, subir fotos ni escribir reportes. La documentación para la defensa está en `docs/guia-defensa.md`; el detalle de evidencia se conserva en `docs/verificacion.md`.

## Pruebas realizadas

| Comando | Resultado de esta sesión |
|---|---|
| npm run typecheck | Sin errores |
| npm run lint | Sin errores ni advertencias |
| npm test | 12 suites, 73 pruebas aprobadas, 0 omitidas; 9.677 s |
| npm run test:security | 7 pruebas SQL aprobadas |
| npm run check:expo | Dependencies are up to date |
| npm run bundle | Android, iOS y web exportados correctamente |
| npm run test:backend | Auth accesible, gyms restringida a sesión y credenciales incorrectas rechazadas con HTTP 400 / invalid_credentials |
| adb devices -l | En la sesión USB posterior reconoció un Samsung autorizado; la disponibilidad actual debe comprobarse al reconectar |

Los mocks sólo están en pruebas. PGlite evalúa el SQL real con un fixture mínimo de Auth/Storage; no emula los servicios alojados. La comprobación HTTP no es un flujo móvil de extremo a extremo. La confirmación de correo sigue activa en Supabase.

## Siguiente tarea y cómo reanudar

1. Leer CONTEXTO-TRASPASO.md y el registro USB; no repetir el análisis inicial ni cambiar backend/arquitectura.
2. Ejecutar desde la raíz `npm exec --workspace @fitcrew/frontend -- expo start --clear` y abrir el QR con Expo Go SDK 58.
3. Continuar sólo los pendientes de `docs/pruebas-manuales.md`: publicación real y segunda cuenta, grupo privado, pérdida de red/cola/reintento y rechazo/bloqueo de permisos. Sesión persistente y captura física ya fueron comprobadas.
4. Validar TalkBack/VoiceOver y completar tipografía ampliada/rotación en las pantallas restantes. Registrar dispositivo, sistema, fecha, resultado y evidencia; no inventar métricas o encuestas.
5. Contrastar la propuesta/rúbrica/Fase 2 cuando estén disponibles y corregir sólo hallazgos concretos.

No se desplegaron nuevas políticas, no se alteró el SQL remoto y no se publicaron datos ficticios. La limitación para cerrar la entrega es la validación física y con cuentas reales, junto con los documentos oficiales ausentes.
