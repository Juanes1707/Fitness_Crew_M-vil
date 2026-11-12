# Registro de verificaciones — migración Supabase

Fecha: 7 de noviembre de 2026, America/Bogota. Entorno: Windows, PowerShell, Node 24.18.0, npm 11.16.0. El usuario confirmó que Firebase era una elección del equipo y autorizó migrar a Supabase manteniendo frontend/backend. Los resultados anteriores de Firebase no se reutilizan como evidencia de esta implementación.

## Evidencia disponible

- `npm run typecheck`: aprobado en la comprobación final, sin errores.
- `npm run lint`: aprobado en la comprobación final, sin errores ni advertencias.
- `npm run check:expo`: Dependencies are up to date.
- Expo Doctor: 18/18 comprobaciones aprobadas. Un primer intento falló en la consulta de metadatos por red; el reintento con el proxy del entorno pasó todas las comprobaciones.
- `npm test -- --silent`: 9 suites y 50 pruebas aprobadas, 0 fallidas, última ejecución observada 5.883 s.
- `npm run test:security`: 7 pruebas aprobadas en PostgreSQL embebido PGlite. Incluye ejecutar dos veces la migración, RLS por roles, acceso anónimo, grupo privado, invitación idempotente, cupo 20, check-ins, rutas Storage, metadatos del bucket, autoría, restricciones de timestamp e inmutabilidad de reportes.
- `npm run bundle`: exportación Android, iOS y web aprobada con las variables Supabase cargadas. Salidas aproximadas: 3.44 MB Android, 3.45 MB iOS y 1.5 MB web. No son mediciones de memoria ni tamaño instalado.
- `node --use-env-proxy backend/scripts/check-connection.mjs`: aprobado contra el proyecto del usuario. Auth respondió HTTP 200, registro por correo habilitado y confirmación activada. Tras ejecutar el SQL, `gyms` fue detectada y el acceso anónimo quedó bloqueado.
- El usuario aportó una captura del SQL Editor con «Success. No rows returned» después de ejecutar la migración. Es evidencia de ejecución del esquema, no de una publicación desde Expo Go.

Distribución Jest: autenticación 7; publicación/fotos 10; gimnasios 3; grupos/check-ins 4; suscripciones 2; interfaz/accesibilidad 4; ocupación 3; pendientes 3; contraste 14. Total 50. Los mocks sólo existen dentro de pruebas.

## Alcance de las pruebas de seguridad

PGlite ejecuta PostgreSQL y evalúa el SQL de producción con roles authenticated/anon. El fixture reproduce auth.users, auth.uid y un esquema mínimo de Storage, y verifica grants/RLS y funciones. No emula la API Auth, procesamiento de uploads, firma de URLs ni distribución Realtime. Las restricciones MIME/tamaño del bucket se inspeccionan como configuración; su aplicación por Storage alojado requiere una subida real. Las identidades usadas en estas pruebas no se crean en Supabase remoto.

La prueba pública de conexión utiliza sólo la Publishable key proporcionada y no crea cuentas, no obtiene datos privados ni sube imágenes. La URL y clave se guardaron en frontend/.env, ignorado por Git. El primer intento de conexión directa encontró un timeout de red; con el proxy del entorno la consulta respondió. Este diagnóstico no implica que el celular requiera un proxy.

## Pendiente de completar

- La carga de los tres gimnasios reales quedó confirmada por captura del usuario con tres filas devueltas. Sus datos provienen del usuario; no se inventaron reportes.
- Registrar una cuenta y probar sesión, cámara, publicación, foto, historial y otra cuenta en Expo Go.
- Validar confirmación de correo o desactivarla para el proyecto exclusivo de pruebas antes de registrar cuentas.
- Comprobar privacidad, actualizaciones en vivo y reconexión con usuarios reales.
- Verificar TalkBack, VoiceOver, texto ampliado, ambos temas y navegación en dispositivo.
- Contrastar los PDF oficiales; medir rendimiento y realizar validaciones de usuario. No existen encuestas ni métricas de dispositivo.

No se declara completado el flujo móvil de extremo a extremo por compilar o pasar pruebas locales. TypeScript y lint volvieron a ejecutarse sin errores. Las verificaciones de Expo y auditoría de dependencias se detallan en el cierre de este registro.


## Cierre local y dependencias antes de SDK 58

`npm start` inició Metro con el proyecto Supabase configurado y mostró el QR en modo Expo Go, puerto 8081. Se deja activo para que el usuario lo pruebe en la misma Wi-Fi. La IP y el QR son temporales y pueden cambiar en el siguiente arranque. No se conectó un teléfono durante esta verificación.

Tras retirar Firebase y sus herramientas, npm audit mantiene 33 alertas: 8 bajas, 20 moderadas, 5 altas y 0 críticas. Se conserva la compatibilidad con SDK 54 y no se aplican actualizaciones forzadas entre SDK. Esto no es una declaración de dependencias libres de vulnerabilidades; deben revisarse antes de una distribución pública. El resultado detallado puede regenerarse con npm audit. Las cuentas/datos Firebase no se migran automáticamente ni se reasignan pendientes antiguos.


## Actualización posterior a Expo SDK 58

La captura del dispositivo mostró Expo Go para SDK 58 y un proyecto SDK 54. Se reprodujo la discrepancia leyendo el manifiesto de dependencias, y se actualizó a Expo 58.0.23, React Native 0.88.1, React 19.3.0 y Expo Router 58.0.30 según el mapa oficial. Supabase, la URL/clave pública y el SQL remoto se conservaron. Se mantuvieron las carpetas frontend y backend.

Se actualizaron Jest a 30, jest-expo a 58.0.14 y React Native Testing Library a 14.1.0 con test-renderer 1.3.0 y el preset React Native 0.88.1. Las operaciones de render/eventos de las pruebas de interfaz ahora se esperan con await. La carga inicial de mocks nativos en este Windows se midió en unos 5.8 s; la suite de interfaz tiene un límite de 15 s, sin esperas artificiales. Se retiraron todos los registros temporales de diagnóstico.

Worklets se fijó explícitamente en 0.13.0 y Reanimated en 4.7.1 en frontend. Se unificó Worklets mediante override para evitar dos copias nativas en los workspaces.

La API estricta de React Native permite que AppState.currentState sea desconocido al iniciar; se añadió un valor inicial para la renovación de sesión. Las nuevas comprobaciones de hooks motivaron mover reinicios de estado a eventos, usar el parámetro de ruta como gimnasio seleccionado, mantener la carga de pendientes en callbacks asíncronos y reiniciar una foto por su key. El reloj usa un inicializador perezoso. FileSystem legacy se conservó porque sigue documentado e incluido en Expo Go SDK 58. La salida web se fijó en single para conservar el comportamiento SPA sin añadir un servidor web.

La primera instalación encontró EBUSY al cambiar dependencias mientras había un Metro abierto desde VS Code. Se verificaron sus procesos con la ruta de este proyecto y se detuvieron únicamente ese Metro y sus workers. El reintento de npm install terminó correctamente. No se borró código, configuración ni datos de Supabase.

| Comprobación SDK 58 | Resultado ejecutado |
|---|---|
| TypeScript | Sin errores después de adaptar AppState |
| ESLint | Sin errores ni advertencias después de adaptar hooks |
| Jest | 9 suites, 50 pruebas aprobadas; 4.066 s en la ejecución final |
| Seguridad PostgreSQL | 7 pruebas aprobadas; sin cambiar políticas remotas |
| expo install --check | Dependencies are up to date |
| Expo Doctor | 20/20 comprobaciones aprobadas |
| Bundle con caché limpia | Android, iOS y web exportados correctamente |
| Metro / manifiesto Android | HTTP 200, sdkVersion 58.0.0, runtimeVersion exposdk:58.0.0 |
| npm audit durante instalación | 31 alertas: 1 baja y 30 moderadas, 0 altas/críticas; no equivale a auditoría exhaustiva |

Para comprobar el manifiesto se inició temporalmente Metro en el puerto 8091, se consultó con Expo-Platform android y se detuvo al terminar. El usuario puede iniciarlo desde VS Code con npm exec --workspace @fitcrew/frontend -- expo start --clear y escanear el QR nuevo. La prueba completa en teléfono permanece pendiente: el manifiesto confirma la versión, pero no verifica cámara, lector de pantalla ni publicación real.

Referencias: [mapa oficial SDK 58](https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json), [migración de Router](https://docs.expo.dev/router/migrate/sdk-57-to-58/), [FileSystem legacy](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/).


## Revisión autónoma funcional y QA

El usuario confirmó conservar Supabase frente a las menciones antiguas a Firebase en la nueva plantilla. Se revisaron los módulos existentes y se añadieron pruebas de pantalla e integración de Expo Router con Redux. Se mantuvieron stack, estructura y dependencias.

Fallos reproducidos y corregidos:

- El detalle interpretaba un catálogo aún no cargado como gimnasio inexistente, y una consulta de reportes pendiente o fallida como historial vacío. Tres pruebas fallaron antes de diferenciar esos estados y pasaron tras corregirlos.
- La vista previa de cámara seguía montada al abandonar la pestaña. La prueba de pérdida de foco falló antes y pasó tras liberar la cámara con useFocusEffect.
- El cierre de sesión desde Perfil entraba en un bucle de render durante la navegación integrada. La prueba alcanzó el límite de memoria de Node; se aisló el fallo exactamente al cerrar sesión, sin aumentar el heap. Definir redirectTo=/login en la ruta privada resolvió el recorrido. La prueba conserva una detección temprana de renders recursivos para fallar antes de agotar memoria. Se retiró la instrumentación temporal.
- El ancho mínimo de Button no estaba garantizado para etiquetas cortas. La prueba de mínimo 48 en ambos ejes falló y pasó al fijar 50×50.
- El selector de gimnasio no comunicaba disabled durante una publicación. Se añadió el estado de bloqueo al componente y a Reportar/Mi crew; la prueba falló antes y pasó después.

Resultados de cierre observados: TypeScript y lint sin errores; 12 suites Jest con 73 pruebas aprobadas en 9.677 s; 7 pruebas SQL aprobadas; expo install --check informa dependencias compatibles. El recorrido de navegación usa componentes y rutas reales, con Auth/datos mockeados exclusivamente en pruebas. Las pruebas de cámara simulan la API nativa y no demuestran funcionamiento de un sensor físico.

`npm run test:backend` se ejecutó contra el proyecto del usuario: Auth accesible, correo habilitado y confirmación activa; tabla gyms encontrada y lectura anónima bloqueada; POST de credenciales sintéticas incorrectas rechazado con HTTP 400 e invalid_credentials, sin token. No se registraron usuarios, no se enviaron correos ni se publicaron reportes. Un intento inicial mediante el SDK encontró un error de red y no se contó como prueba aprobada; la comprobación HTTP reproducible posterior sí respondió como se esperaba.

ADB está instalado, pero `adb devices -l` devolvió una lista vacía. No se ejecutaron pruebas físicas, TalkBack/VoiceOver, publicación real desde cámara ni consulta entre dos cuentas reales. También faltan los documentos oficiales y no hay repositorio Git. El estado por módulo y las instrucciones de reanudación están en docs/progress.md.

El empaquetado de cierre de esta revisión terminó con código 0 para Android, iOS y web. No se interpretó este resultado como una ejecución en teléfono. La aplicación conserva Supabase y Expo SDK 58.

## Validación Android física por USB

Se ejecutaron acceso/catálogo, búsqueda/detalle, captura y liberación de cámara, persistencia de sesión después de force-stop y revisión del listado en claro/oscuro. Texto al 200% reprodujo recortes de pestañas: se corrigieron con altura adaptable y etiquetas multilínea y se repitió la revisión visual. Evidencia y límites en docs/prueba-android-usb.md. No se publicaron reportes. Tras el ajuste pasaron typecheck, lint, 73 pruebas Jest, 7 pruebas SQL embebidas y check:expo. La escala de fuente y el tema se restauraron; FitCrew quedó en Gimnasios, sin cámara activa.


## 9 de noviembre — sesión protegida y rúbrica

SecureStore SDK 58 instalado con plugin; adaptador sessionStorage con migración y fragmentos cifrados. 10 pruebas nuevas del adaptador/SDK (red y almacenamiento nativo simulados), más 4 de Mi crew; una reprodujo el fallo de membresía desconocida tratada como grupo ausente, corregido. Resultado final: 14 suites, 87 pruebas Jest aprobadas (8.504 s en repetición), 7 SQL PGlite, typecheck y lint limpios, check:expo compatible, bundle Android/iOS/web exitoso. Smoke remoto: Auth accesible, gyms protegida, credenciales incorrectas rechazadas con 400; sin cuentas creadas ni reportes subidos. Instalación auditó alertas bajas/moderadas, sin ejecutar audit fix. ADB devuelve lista vacía incluso reiniciado; Windows sólo reconoce A56 por Bluetooth. No hay evidencia física nueva de SecureStore. Documentación y pendientes consolidados en estado-rubrica.md; informe corregido y guion-demo.md añadido. No hubo despliegue ni cambios SQL remotos.


Resultado USB posterior del 9: el A56 apareció autorizado. Con SecureStore real en Expo Go, apertura autenticada sin reingreso, persistencia tras force-stop y salida persistente tras otro reinicio aprobadas. No se borraron datos ni se extrajeron tokens. La dificultad inicial de conexión está resuelta. Ver prueba-sesion-segura-android.md. Renovación forzada nativa y E2E restantes pendientes.


Cierre físico adicional del día 9: un anuncio de TalkBack confirmado por el usuario tras cerrar tutorial; auditoría completa pendiente. Cola local probada sin red: 1/5 después de guardar, foto/metadata recuperadas tras force-stop, eliminación hasta 0/5. Se terminó Expo Go antes de volver a habilitar Internet. No se publicó la captura; usuario aclaró que no estaba en gimnasio piloto. Red y accesibilidad restauradas, catálogo real cargado y Athletic sin reportes. Ver prueba-sesion-segura-android.md.

