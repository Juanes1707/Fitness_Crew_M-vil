# FitCrew — avance de desarrollo y QA

Fecha: 7 de noviembre de 2026, America/Bogota. Estado: implementación del MVP revisada y verificada localmente; validación Android parcial ejecutada por USB. Evidencia actualizada en [prueba-android-usb.md](prueba-android-usb.md): acceso, catálogo/búsqueda/detalle, persistencia tras force-stop, captura física y liberación de cámara, listado claro/oscuro y corrección de pestañas recortadas al 200%. Las tablas siguientes conservan el estado de la revisión local anterior; el registro USB precisa qué pendientes ya se comprobaron.

El usuario confirmó **conservar Supabase**. Las referencias a Firebase de la plantilla se corresponden con Supabase Auth, PostgreSQL, Storage y Realtime. Se mantuvieron Expo SDK 58, TypeScript, Redux Toolkit/React Redux, las carpetas frontend/backend y las dependencias existentes.

No se encontraron los PDF de propuesta, rúbrica Fase 3, accesibilidad Fase 2 ni un documento independiente de arquitectura. Se usaron el código, README, informe y requisitos del usuario. La carpeta no tiene repositorio Git; no se fabricaron historial ni contribuciones.

## Estado por funcionalidad

| Funcionalidad | Estado verificable | Evidencia / pendiente |
|---|---|---|
| Expo y navegación | Implementado y probado localmente | Rutas protegidas, acceso, listado, detalle, pestañas y cierre de sesión; empaquetado final registrado abajo |
| React Redux | Implementado y probado integrado | El recorrido usa el store real; al cerrar sesión limpia perfil, gimnasios y suscripciones |
| Autenticación | Implementado; unidad y rechazo remoto probados | Registro y sesión con mocks; HTTP real rechaza credenciales incorrectas. Acceso correcto y persistencia nativa pendientes |
| Gimnasios y búsqueda | Implementado; servicios y pantalla probados | Tres pilotos cargados por el usuario; pruebas de búsqueda, catálogo vacío, carga e ID inexistente |
| Reportes y cámara | Implementado; servicio y pantalla probados | Permisos, captura mock, confirmación, fallo, reintento, selección bloqueada y liberación al salir. Sensor físico y publicación real pendientes |
| Ocupación e historial | Implementado y probado localmente | Último reporte, fotografía, historial, vigencia, resumen y distinción entre carga/error/vacío |
| Amigos y privacidad | Implementado; servicios y RLS probados | RPC, membresía, cupo y check-ins en PostgreSQL embebido. Dos cuentas reales pendientes |
| Pendientes | Implementado y probado localmente | Copia antes de publicar, límite, escritura/lectura, separación por UID y conservación ante error. Corte/reinicio físico pendiente |
| Accesibilidad | Implementado y parcialmente validado | Etiquetas, roles, estados, contraste y Button 50×50 automáticos. TalkBack, VoiceOver y revisión visual al ampliar texto pendientes |
| Documentación | Actualizada | README, informe de cinco secciones, matriz, pruebas manuales, guia-defensa.md y este registro |

## Problemas detectados y correcciones aplicadas

1. **Detalle mostraba inexistente/vacío antes de terminar la consulta.** En `frontend/app/gym/[id].tsx` se separaron carga del catálogo, ID inexistente, carga de reportes, error y vacío confirmado. Tres pruebas reprodujeron el fallo antes del cambio y pasaron después.
2. **La cámara seguía montada al abandonar la pestaña.** En `frontend/app/(tabs)/report.tsx` se libera la vista previa y su estado de preparación con `useFocusEffect`. Prueba de pérdida de foco aprobada después de fallar inicialmente.
3. **Bucle al cerrar sesión desde una ruta privada en SDK 58.** En `frontend/app/_layout.tsx` se añadió `redirectTo="/login"` a la protección privada. La prueba integrada aisló el fallo al cerrar sesión y ahora completa el recorrido sin bucles. No se aumentó la memoria de Node para ocultarlo.
4. **Ancho táctil mínimo no garantizado para etiquetas cortas.** `frontend/src/components/ui.tsx` define mínimo 50×50. La prueba del contrato mínimo 48 en ambos ejes falló antes y pasó después.
5. **Selector sin estado disabled durante operaciones.** `GymPicker.tsx` recibe disabled; Reportar y Mi crew lo activan mientras trabajan. La prueba durante una publicación diferida ahora pasa.

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
| adb devices -l | Lista vacía: no hay teléfono autorizado conectado al entorno de pruebas |

Los mocks sólo están en pruebas. PGlite evalúa el SQL real con un fixture mínimo de Auth/Storage; no emula los servicios alojados. La comprobación HTTP no es un flujo móvil de extremo a extremo. La confirmación de correo sigue activa en Supabase.

## Siguiente tarea y cómo reanudar

1. Revisar este archivo y los resultados finales de empaquetado en verificacion.md; no repetir el análisis inicial ni cambiar backend/arquitectura.
2. Ejecutar desde la raíz `npm exec --workspace @fitcrew/frontend -- expo start --clear` y abrir el QR con Expo Go SDK 58.
3. Con una cuenta real y su correo confirmado, ejecutar `docs/pruebas-manuales.md`: sesión persistente, foto real, reporte desde un gimnasio piloto, consulta desde otra cuenta, grupo privado, pérdida de red y reinicio.
4. Validar TalkBack/VoiceOver y tipografía ampliada en dispositivo. Registrar dispositivo, sistema, fecha, resultado y evidencia; no inventar métricas o encuestas.
5. Contrastar la propuesta/rúbrica/Fase 2 cuando estén disponibles y corregir sólo hallazgos concretos.

No se desplegaron nuevas políticas, no se alteró el SQL remoto y no se publicaron datos ficticios. La limitación para cerrar la entrega es la validación física y con cuentas reales, junto con los documentos oficiales ausentes.
