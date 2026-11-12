# Sesión protegida — Android físico, 9 de noviembre de 2026

Samsung SM-A566E, Android 16, Expo Go 58.0.5, proyecto Expo SDK 58. Sesión preexistente del usuario; no se borraron datos, no se reinstaló Expo Go y no se extrajeron credenciales.

1. Inicialmente ADB no detectaba dispositivos; Windows sólo mostraba el teléfono por Bluetooth. Tras la intervención del usuario con USB, `adb devices -l` lo reconoció autorizado. Esta dificultad de conexión quedó resuelta; no es un fallo de FitCrew.
2. Metro iniciado desde frontend en puerto 8081 con el código de SecureStore; `adb reverse` y apertura de `exp://127.0.0.1:8081`. La aplicación llegó al catálogo autenticado sin pedir contraseña. Es evidencia de continuidad tras cambiar el adaptador y migración en el flujo normal, no inspección forense del almacenamiento nativo.
3. Force-stop de Expo Go y reapertura del proyecto: catálogo autenticado nuevamente. El primer intent abre LauncherActivity; al traer de nuevo la experiencia al primer plano se abre ExperienceActivity. No se interpretó la pantalla Ajustes que quedaba debajo como un crash.
4. Perfil → Cerrar sesión: volvió al acceso. Nuevo force-stop y reapertura: sigue en acceso, sin restaurar la cuenta anterior.
5. Se pidió al usuario iniciar sesión directamente para continuar. No se solicitaron ni registraron contraseñas/tokens. La renovación forzada de token en teléfono queda pendiente; el ciclo de renovación con SDK real y red simulada ya pasa en Jest.

## Continuación de la misma sesión

- El usuario volvió a iniciar sesión; se observó nuevamente el catálogo autenticado. No incorporar credenciales que el usuario haya compartido por chat a archivos, pruebas, capturas o comandos.
- TalkBack activado temporalmente. El primer intento abrió el tutorial; el usuario confirmó que sólo oyó éste, por lo que no se marcó auditoría aprobada. Se cerró con Finish y su confirmación, se volvió a FitCrew y se observó foco en Buscar gimnasio. Se pidió confirmación auditiva del segundo intento; pendiente. Después se restauraron accessibility_enabled=0 y enabled_accessibility_services ausente.
- Se intentó probar rechazo de cámara retirando temporalmente su permiso. Android mostró el diálogo, pero el resultado observado fue cámara abierta; no hay evidencia fiable de rechazo y no se marca aprobado. Se restauró CAMERA concedido y se retiró user-fixed. No se modificaron reglas Supabase.
- El usuario indicó Athletic Medio y confirmó que ése era el piloto donde estaba. Se seleccionó Athletic y Medio y se capturó una foto, pero la imagen mostraba mesa/objetos cercanos, no la ocupación del gimnasio. No se pulsó publicar y no se subió nada. Se solicitó orientar la cámara a una zona adecuada y repetir. La foto sólo está en vista previa, no en la cola durable (ésta se guarda al confirmar).
- Niveles de otros pilotos mencionados por el usuario no se publicaron sin sus fotos correspondientes. Segunda cuenta, grupos, offline y publicación E2E siguen pendientes.

### Aclaración posterior del usuario

El usuario aclaró que no estaba físicamente en Athletic. Por ello no se publicará la captura de escritorio ni los niveles mencionados en gimnasios reales; sólo sirve para pruebas locales o para un entorno separado autorizado. No se subió ningún reporte. En TalkBack el usuario indicó nuevamente que escuchaba el tutorial, no controles de FitCrew. La comprobación auditiva no está aprobada. Se continuó cerrando la confirmación del tutorial mediante foco de teclado y Enter; Android llegó a mostrar ExperienceActivity al frente con foco en Ver Athletic Gym Chía. Se solicitó comprobar el anuncio real antes de atribuir éxito o fallo a la app.

### Resultados finales de TalkBack y cola local

- Tras los intentos anteriores, el usuario finalmente confirmó que escuchó «Ver Athletic Gym Chía». Se registra sólo ese anuncio/foco como comprobación parcial, no toda la auditoría. Se restauraron los servicios de accesibilidad desactivados (0 y lista ausente), igual que al inicio.
- Prueba local de cola con la captura de escritorio: Wi-Fi estaba apagado y datos móviles encendidos. Se desactivaron datos y se comprobó `Active default network: none` antes de pulsar Confirmar. Metro continuó por USB. El contador pasó de 0/5 a 1/5.
- Se terminó el proceso Expo Go sin restaurar Internet, cancelando las peticiones en vuelo. Se reabrió offline: sesión restaurada, catálogo con error de conexión y pantalla Reportar con 1/5, nivel Medio y fotografía guardada pendiente. Esto comprueba copia durable/recuperación, no una publicación remota.
- Se pulsó Eliminar pendiente de este dispositivo y se observó 0/5. Antes de restaurar red se volvió a terminar Expo Go, evitando cualquier petición pendiente de la prueba. Después se restauraron datos encendidos y Wi-Fi apagado. Al abrir nuevamente, catálogo real cargado y Athletic seguía «Sin reportes disponibles». No se subió el reporte local.
- Pendientes de esta área: reintento con conexión con datos reales, deduplicación remota y aislamiento físico al cambiar cuenta. La recuperación/descarte offline de esta cuenta sí quedó comprobada.

La prueba comprueba comportamiento observable de restauración y salida con SecureStore real en Expo Go; no certifica protección ante un dispositivo comprometido. No se publicaron reportes, fotos ni cambios SQL. La evidencia Android del 7 se conserva en prueba-android-usb.md; la del 9 se refiere al storage nuevo.

Observación de compatibilidad: el SDK Supabase actual advierte que la opción processLock está deprecada. El flujo observado funciona y no se eliminó esa opción por preferencia; revisar la migración de coordinación cuando se actualice el SDK. No se ocultaron los avisos.
