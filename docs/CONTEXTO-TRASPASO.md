# FitCrew — contexto de traspaso para continuar el proyecto

Actualización del 12 de noviembre: ver [carga-imagenes.md](carga-imagenes.md). El usuario confirmó que publicar funciona; se canceló su diagnóstico anterior sin cambiar ese flujo. Se añadió expo-image y caché de firmas/fotografías, prioridad de foto principal e históricas bajo demanda. Últimas pruebas: 90 Jest y 7 SQL, typecheck/lint/check:expo aprobados. No hay métricas físicas de segundos ahorrados ni cambios remotos.

Resultado USB posterior del día 9: conexión resuelta, migración/continuidad de sesión y restauración tras force-stop comprobadas; salida persistente tras otro reinicio comprobada. Detalle en [prueba-sesion-segura-android.md](prueba-sesion-segura-android.md). La nota inferior de ADB vacío corresponde al inicio de esta sesión, no al estado final de esa prueba. Renovación forzada nativa sigue pendiente.

**Actualización prioritaria del 9 de noviembre:** leer también [estado-rubrica.md](estado-rubrica.md). La rúbrica Fase 3 ya se recibió. Auth nativo ahora usa `sessionStorage.ts` con SecureStore, migración desde AsyncStorage, fragmentación segura para sesiones grandes y renovación/salida probadas con SDK real y red simulada. Nueva regresión de Mi crew corregida: error de membresía no equivale a ausencia de grupo. Último resultado: 14 suites/87 pruebas Jest, 7 SQL, typecheck/lint/check:expo y bundle Android/iOS/web aprobados. Smoke remoto aprobado sin escrituras. Repetir persistencia/salida físicas por el cambio de storage: ADB no detecta teléfono el día 9. Git ahora tiene remoto y dos commits de un autor. El resto del documento conserva el traspaso histórico del día 8; esta actualización prevalece donde cambie estado.

Actualizado el **8 de noviembre de 2026**, America/Bogota. Consolida decisiones, implementación y verificaciones realizadas hasta el 7 de noviembre. La actualización del día 8 es documental; cualquier nueva ejecución de comprobaciones se registra al final.

## 1. Punto de partida para el compañero

El MVP está implementado y funciona parcialmente verificado en Android físico. **Continuar desde este estado; no reconstruir la aplicación, volver a migrar el backend ni repetir el diagnóstico inicial.** Leer este documento, `AGENTS.md` y los archivos relacionados con la tarea concreta.

Las pruebas ya aprobadas son evidencia histórica, no garantía sobre modificaciones futuras. Repetir las comprobaciones locales obligatorias antes de entregar cambios. Repetir una prueba física cuando se modifique su flujo, aparezca una regresión o cambien dispositivo, SDK, permisos o configuración remota; no rehacer toda la campaña sólo para ponerse al día.

La carpeta original de trabajo es:

```powershell
cd "C:\Users\Juan Esteban\OneDrive - Universidad de la Sabana\Desktop\Fitness_Crew_Móvil"
```

Esta ruta pertenece al equipo original. En otro computador usar la ruta de su propia copia. En las sesiones anteriores no había repositorio Git; no inventar commits, autores ni contribuciones. Si se incorpora Git posteriormente, comprobar el estado real antes de operar.

## 2. Decisiones autorizadas y restricciones

- Aplicación académica mínima, orientada a consultar/reportar ocupación de gimnasios y compartir check-ins con un grupo privado.
- El usuario pidió dos carpetas principales: **frontend** y **backend**. Mantenerlas.
- Se empezó con Firebase y se migró completamente a **Supabase por autorización explícita del usuario**. El profesor no exige Firebase. Un adjunto posterior volvía a mencionarlo, pero el usuario confirmó **conservar Supabase**. No reabrir esa decisión por textos antiguos.
- Mantener Expo SDK 58 / Expo Go 58, TypeScript, Expo Router, Redux Toolkit + React Redux, Supabase JS SDK y StyleSheet. Servicios directos, sin añadir capas, servidores o frameworks innecesarios.
- Usar datos reales en producción. Los mocks pertenecen exclusivamente a pruebas. No inventar reportes de ocupación ni subir una foto de escritorio a un gimnasio real para completar una prueba.
- No desplegar ni publicar políticas SQL sin autorización. El SQL inicial y el catálogo los ejecutó el usuario en Supabase; las revisiones posteriores no modificaron políticas remotas.
- No incluir contraseñas, tokens de sesión, claves secret/service_role, credenciales de cuentas ni contraseñas PostgreSQL en código o documentación.
- No presentar pruebas con mocks, SQL embebido o bundles como pruebas físicas de extremo a extremo. No declarar conformidad completa de accesibilidad, encuestas o métricas que no se han medido.

## 3. Arquitectura y mapa del código

Es un monorepo npm con dos workspaces y **un lockfile en la raíz**. Instalar desde la raíz; no generar lockfiles independientes.

| Ruta | Responsabilidad |
|---|---|
| `frontend/app/_layout.tsx` | Provider Redux, arranque, sesión y rutas protegidas |
| `frontend/app/index.tsx`, `login.tsx`, `register.tsx` | Entrada y autenticación |
| `frontend/app/(tabs)/_layout.tsx` | Pestañas; altura adaptable a fuente y safe area |
| `frontend/app/(tabs)/index.tsx` | Catálogo y búsqueda de gimnasios |
| `frontend/app/gym/[id].tsx` | Detalle, ocupación, historial y resumen horario |
| `frontend/app/(tabs)/report.tsx` | Cámara, selección, confirmación y pendientes |
| `frontend/app/(tabs)/friends.tsx` | Crear/unirse a grupo y check-ins |
| `frontend/app/(tabs)/profile.tsx` | Perfil, tema y cierre de sesión |
| `frontend/src/store/` | Store y slices de auth, gimnasios/reportes y preferencias |
| `frontend/src/components/` | AuthForm, GymPicker, ReportPhoto y controles compartidos |
| `frontend/src/hooks/` | Acceso tipado al store, tema y reloj de vigencia |
| `backend/services/supabase.ts` | Cliente Supabase y configuración pública |
| `backend/services/authService.ts` | Registro, acceso, sesión y salida |
| `backend/services/gymService.ts`, `watchQuery.ts` | Consultas, suscripciones y refresco |
| `backend/services/reportService.ts` | Foto, publicación y URLs firmadas |
| `backend/services/pendingService.ts` | Cola local por cuenta, copia durable y eliminación |
| `backend/services/friendService.ts` | Grupos, RPC y check-ins |
| `backend/types/`, `backend/utils/` | Modelos, validación, errores, timeout y ocupación |
| `backend/supabase/migrations/001_fitcrew.sql` | Tablas, permisos, RLS, funciones, bucket y Realtime |
| `backend/supabase/seed-gyms.sql` | Catálogo real de tres gimnasios piloto |
| `tests/` | Jest de servicios, pantallas, navegación y accesibilidad |
| `backend/tests/security.test.mjs` | SQL real bajo roles/RLS con PGlite |
| `backend/scripts/check-connection.mjs` | Smoke HTTP de Supabase sin escribir reportes |

**No hay un servidor Node adicional que iniciar.** Los servicios de `backend/services` se ejecutan en el cliente móvil usando Supabase JS. Auth, PostgreSQL, Storage y Realtime están alojados en Supabase. La confianza y autorización remota se imponen con permisos/RLS SQL, no con la separación de carpetas. Redux guarda estado de interfaz, no sustituye PostgreSQL.

## 4. Stack instalado y actualización de Expo

Se actualizó de SDK 54 a SDK 58 porque el Expo Go del teléfono rechazaba el proyecto antiguo. La compatibilidad SDK 58 ya se comprobó con manifiesto Metro y en el dispositivo físico.

- Expo `~58.0.23`, Router `~58.0.30`, React Native `0.88.1`, React y React DOM `19.3.0`.
- Reanimated `4.7.1`, Worklets `0.13.0` como dependencias explícitas del frontend.
- Jest 30, jest-expo 58, React Native Testing Library 14.1 y preset RN 0.88.
- La raíz tiene overrides para unificar React/DOM/RSC 19.3 y Worklets 0.13. No eliminarlos como supuesto sobrante sin verificar el árbol de dependencias.
- Se usó Node 24.18. El campo engines admite las líneas soportadas: Node 22.13+, 24.3+ o 26+.
- `frontend/app.json` utiliza salida web `single`. FileSystem usa la API `expo-file-system/legacy`, compatible con el stack actual.

No bajar SDK ni actualizar indiscriminadamente con `npm audit fix --force`. El audit anterior informó 31 alertas bajas/moderadas y ninguna alta/crítica; es un resultado histórico, no una auditoría de seguridad completa ni el estado actual del registro npm.

## 5. Supabase ya configurado

Proyecto del usuario: `https://hxlrpyuhxkezjhjimzwe.supabase.co`.

La URL y publishable key aportadas por el usuario se guardaron en **`frontend/.env`**, excluido de Git. No se copia la clave a esta guía. En otro equipo el archivo no viajará por Git: preparar `frontend/.env` desde `.env.example` y obtener la clave pública del propietario/dashboard.

Variables:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Se admite también anon key pública clásica. Nunca sustituirla por service_role o una clave secret. Reiniciar Metro después de cambiar el entorno. No sobrescribir un `.env` existente al seguir las instrucciones de instalación.

El usuario ejecutó la migración SQL en SQL Editor y mostró éxito. También ejecutó el seed y mostró tres filas. **No pedirle crear otro proyecto, repetir todo el SQL o volver a insertar los gimnasios para continuar.** Cambios futuros de esquema requieren revisión y autorización propias; contrastar el SQL local con el remoto si se modifica.

| ID | Gimnasio | Dirección aportada por el usuario |
|---|---|---|
| `athletic-gym-chia` | Athletic Gym Chía | Cra. 1 #5-30, Chía |
| `bodytech-plaza-mayor-chia` | Bodytech Plaza Mayor Chía | Centro Comercial Plaza Mayor, Local 121, Av. Pradilla No. 5 - 31 Este, Chía |
| `smartfit-central-park-chia` | Smart Fit - Central Park Chía | Cra. 10 #6-130, Chía |

Modelo: `gyms`, `reports`, `groups`, `profiles`, `checkins`. Bucket privado `report-photos`. RPC de creación/ingreso a grupo, máximo 20 miembros y un grupo activo por usuario. No hay chat, expulsión, revocación ni administración de grupos.

Confirmación de correo estaba activa en la comprobación remota. El usuario creó una cuenta e inició sesión directamente en el teléfono. No conocemos ni necesitamos su contraseña. El flujo muestra instrucciones para confirmar correo y volver manualmente al login; no hay retorno automático por deep link.

## 6. Comportamiento implementado que debe conservarse

- Gimnasios reales desde PostgreSQL; búsqueda sin distinguir acentos. Vacío y error son estados distintos.
- Reporte con nivel Vacío/Medio/Lleno y foto; se confirma antes de publicar. JPEG menor a 5 MiB, subida como ArrayBuffer y fila posterior con hora asignada por PostgreSQL.
- Reportes/fotos inmutables desde el cliente. Reintentos con UUID estable; si una petición termina tarde, el mismo ID permite reconciliar sin duplicados.
- Hasta cinco pendientes por cuenta/dispositivo. Antes de publicar se copia la imagen al almacenamiento durable y se guarda la cola local; reintento manual. Cambiar de cuenta no reasigna pendientes ajenos.
- La fecha pública es la de publicación, no captura. Descartar fotos antiguas; un timeout no cancela una petición ya enviada. Puede quedar una foto remota huérfana ante un flujo incompleto; no hay limpieza automática.
- Vigencia de 60 minutos. Historial hasta 100 reportes, presentación por tandas de diez. Resumen histórico por franjas horarias de Colombia UTC−5: codificación 0/1/2 y promedio redondeado; no es una predicción.
- Realtime dispara consultas sujetas a RLS; refresco adicional al volver a la app y cada 30 segundos. Se limpian suscripciones/temporizadores al salir.
- Fotos visibles para cuentas autenticadas mediante URLs firmadas de una hora. Quien recibe el enlace puede usarlo mientras sea válido. Actividad de grupos restringida por membresía.
- Temas claro/oscuro/sistema, etiquetas y estados accesibles, niveles con texto e icono, objetivos Button de 50×50 y texto adaptable.

## 7. Fallos ya corregidos: no volver a investigarlos desde cero

| Fallo | Solución/evidencia |
|---|---|
| Detalle decía inexistente o vacío mientras cargaba/fallaba la consulta | Estados separados en `gym/[id].tsx`; regresiones de pantalla aprobadas |
| Cámara permanecía montada al cambiar de pestaña | Limpieza con `useFocusEffect` en Reportar; prueba automatizada y CONNECT/DISCONNECT físico |
| Bucle de renders al cerrar sesión en Router 58 | `redirectTo="/login"` en la protección privada de `_layout.tsx`; navegación integrada vuelve al acceso y limpia datos |
| Ancho táctil mínimo insuficiente para texto corto | Button define mínimo 50×50; prueba del mínimo Android aprobada |
| Selector no anunciaba bloqueo durante publicación | Prop disabled en GymPicker y pantallas; prueba con operación diferida |
| Nombres de pestañas recortados al 200% | Barra con altura según fontScale y safe area, etiquetas multilínea e iconos decorativos sin escalado; captura antes/después en Android |

La prueba de navegación llegó a agotar memoria cuando existía el bucle. No se resolvió aumentando el heap: se aisló y corrigió el redirect. Conserva un guard que falla temprano ante `Maximum update depth exceeded`. No quedan logs temporales de ese diagnóstico.

## 8. Qué está probado y hasta dónde llega la evidencia

### Local automatizado

Último cierre de desarrollo del 7 de noviembre: todos aprobados.

| Comprobación | Resultado y alcance |
|---|---|
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores |
| `npm test` | 12 suites, 73 pruebas, 0 omitidas |
| `npm run test:security` | 7 pruebas con PostgreSQL embebido PGlite |
| `npm run check:expo` | Dependencias compatibles |
| `npm run bundle` | Android/iOS/web exportados en el cierre previo al ajuste visual de pestañas; no se afirma un bundle posterior a ese ajuste |
| Expo Doctor | 20/20 en la actualización del SDK; resultado histórico |

Jest cubre autenticación, queries/suscripciones, servicios de gimnasios/reportes/grupos, pendientes, ocupación, contraste, controles accesibles y pantallas. `tests/navigation.test.tsx` usa rutas y reducers reales, pero Auth/datos mockeados; Reportar/Mi crew son placeholders en ese recorrido, con pruebas de Reportar por separado. No equivale a E2E remoto.

PGlite ejecuta la migración real, grants, roles y RLS; usa stubs mínimos de `auth.uid`, usuarios y esquema Storage. Prueba anonimato, membresía, atomicidad, cupo, fotografías/reporte propios, inmutabilidad y fechas. **No ejecuta los servicios alojados de Auth/Storage/Realtime.** No necesita Docker, Java ni credenciales administrativas.

### Supabase alojado

Ya se comprobaron: Auth accesible, correo habilitado y confirmación activa; existencia de `gyms` y rechazo de consulta anónima; credenciales incorrectas sintéticas rechazadas con HTTP 400 `invalid_credentials`, sin token. El smoke no registra usuarios, no envía correos y no escribe reportes.

Además, el acceso y el catálogo autenticado se comprobaron desde el Android real. No se probó todavía la escritura remota completa de reportes/fotos ni la observación desde otra cuenta.

### Android físico — 7 de noviembre

Samsung **SM-A566E**, Android 16, Expo Go **58.0.5**, SDK del proyecto 58. USB autorizado. No asumir que siga conectado hoy.

- Abrió FitCrew por USB sin incompatibilidad.
- Formulario vacío: error «Escribe un correo válido».
- Usuario inició sesión; catálogo y selector muestran los gimnasios reales.
- Búsqueda `Athletic`: resultado correcto; `Athletic5`: cero resultados.
- Detalle Athletic: dirección, ausencia explícita de reportes y resumen sin datos. Atrás nativo retorna al listado.
- Cámara trasera real: vista previa, captura de superficie preparada por el usuario y opción de repetir. No se publicó.
- Android `dumpsys media.camera` mostró la liberación de la cámara tras capturar y tras abandonar la pestaña.
- `am force-stop` y nueva apertura conservaron sesión sin pedir contraseña.
- Listado claro y oscuro revisado; texto al 200% reprodujo y luego confirmó corrección de las pestañas. No es una revisión completa de todas las pantallas/tamaños.
- Se restauraron font_scale 1.0 y preferencia «Usar tema del dispositivo». Se dejó Gimnasios sin cámara activa.

Detalle: [prueba-android-usb.md](prueba-android-usb.md). Capturas en `docs/evidence/android/`. Las de fuente 200 antes/después y tema claro son evidencia pertinente. `03-permission.png` ya muestra cámara abierta, no el diálogo; `04-restart.png` muestra Ajustes durante una transición, no un crash. No reinterpretarlas como fallos.

## 9. Pendientes reales, por prioridad

1. **Flujo remoto de reporte y segunda cuenta:** foto e información reales de un gimnasio piloto, o entorno separado autorizado para datos de prueba. Verificar subida, fila, hora del servidor, imagen, historial, resumen y actualización en otra cuenta/dispositivo. No usar ocupación inventada en los pilotos.
2. **Sin conexión en Android:** antes de confirmar cortar red, verificar error/timeout, reiniciar, recuperar foto/pendiente con la misma cuenta, aislamiento al cambiar cuenta, reintento sin duplicados y descarte. Tener cuidado: Metro por USB y Supabase por Internet son conexiones distintas; desconectar sólo Metro no demuestra caída del backend.
3. **Grupos con cuentas reales:** crear/compartir código/unirse, check-ins visibles para miembros y ausencia de acceso desde una tercera cuenta. La prueba SQL ya pasa; falta E2E.
4. **Permisos:** denegar y bloquear cámara, mensajes/reintento/Ajustes y restauración. En el diálogo anterior hubo intervención simultánea; el rechazo físico no se marcó aprobado. Expo Go puede añadir su propio permiso por experiencia sobre el permiso Android compartido.
5. **Accesibilidad completa:** TalkBack con validación auditiva y orden de foco; todas las pantallas con texto grande, teclado, rotación. Sólo listado y pestañas tuvieron revisión visual parcial al 200%. VoiceOver/iOS requiere dispositivo o Mac; no se ha probado.
6. **Errores remotos de fotos/permisos:** comprobar manejo sin cierre y restauración en entorno adecuado, sin romper las políticas del proyecto real.
7. **Documentos académicos:** faltan propuesta/rúbrica oficial/Fase 2 para contrastar la entrega. No atribuir requisitos que no se han recibido. No hay encuestas, pruebas con participantes ni mediciones de latencia, memoria, batería o FPS.

No hace falta repetir registro, configuración inicial del proyecto Supabase, seed o diagnóstico SDK para abordar estos puntos. Solicitar al usuario sólo la acción física o dato que realmente falte, nunca la contraseña por chat.

## 10. Ejecutar, verificar y conectar por USB

Desde la raíz, en una copia nueva:

```powershell
npm ci
npm start
```

Si ya están instaladas las dependencias y no cambió el lockfile, no reinstalar por rutina. Para limpiar caché de Metro cuando haga falta:

```powershell
npm exec --workspace @fitcrew/frontend -- expo start --clear
```

Revisar si Metro ya corre antes de abrir otro proceso. El puerto anterior fue 8081, no una promesa de puerto actual. No terminar procesos Node ajenos al proyecto. En Android por USB:

```powershell
adb devices -l
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent
```

Requiere cable de datos, depuración USB y aceptar RSA en el teléfono. `device` significa autorizado; `unauthorized` requiere aceptación; lista vacía requiere revisar cable/puerto/driver. ADB estaba instalado mediante scrcpy/WinGet en este equipo, no en la ruta estándar de Android SDK. No hardcodear esa ruta en otro computador. La redirección se pierde al reconectar/reiniciar ADB. El teléfono necesita Internet para Supabase aunque Metro viaje por USB.

Comprobaciones obligatorias antes de entregar:

```powershell
npm run typecheck
npm run lint
npm test
npm run test:security
npm run check:expo
```

Adicionales según cambio:

```powershell
npm run bundle
npm run check:backend
npm run test:backend
```

En este Windows, Node puede necesitar el proxy del entorno para comprobaciones HTTP/Expo:

```powershell
$env:NODE_USE_ENV_PROXY='1'
npm run check:expo
```

Esto es configuración de la terminal, no una variable pública que haya que añadir a la app. No diagnosticar automáticamente un timeout aislado de Node como fallo de Supabase. `npm run web` ayuda a revisar presentación; FileSystem durable y aceptación móvil se comprueban en Expo Go.

## 11. Documentación y criterio para continuar

- Esta guía: punto de entrada actualizado y resumen consolidado.
- `docs/prueba-android-usb.md`: autoridad sobre qué pruebas Android físicas se ejecutaron.
- `docs/verificacion.md`: cronología de verificaciones; incluye estados antiguos, leer las entradas posteriores.
- `docs/progress.md`: estado resumido; actualizado para no volver a marcar como pendientes las comprobaciones Android aprobadas.
- `docs/pruebas-manuales.md`: protocolo general, no lista de resultados aprobados.
- `docs/configurar-supabase.md`: configuración inicial si se necesita otra instalación, no instrucción para recrear la existente.
- `docs/informe-final.md`: informe académico de cinco secciones.
- `docs/defensa-tecnica.md`, `docs/guia-defensa.md`: explicación y recorrido de sustentación.
- `docs/accesibilidad.md`: matriz y límites; no certificación.

Al terminar una tarea, registrar archivos cambiados, motivo, resultados reales y pendientes. Actualizar esta guía si cambian decisiones/estado importante. Conservar evidencia previa con su fecha; una observación nueva prevalece sobre un pendiente antiguo. Si sólo se busca contexto, leer estas notas evita ejecutar de nuevo todo el proyecto para descubrir lo ya documentado.

## 12. Cierre documental — 8 de noviembre de 2026

Se creó esta guía, se enlazó desde AGENTS.md y README y se corrigieron los pendientes desactualizados de progress.md. No se cambió código de aplicación, dependencias ni configuración remota. No se repitieron pruebas físicas.

Por la instrucción de comprobaciones antes de entregar, se ejecutaron nuevamente: typecheck y lint sin errores; Jest 12 suites/73 pruebas aprobadas (21.595 s); seguridad SQL 7/7; check:expo compatible. Se verificaron los enlaces locales de esta guía y no se incluyeron claves ni contraseñas. No se volvió a exportar bundle ni a ejecutar el smoke remoto en esta actualización documental.
