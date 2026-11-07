# Pruebas en dispositivo — pendientes

Actualización Android por USB: se ejecutó parte de esta lista en Samsung SM-A566E con Android 16 y Expo Go 58.0.5. Consultar [prueba-android-usb.md](prueba-android-usb.md) para resultados, evidencia y pendientes restantes; esta lista general no implica que todos sus puntos sigan sin ejecutar.

Completar en Android con TalkBack e iOS con VoiceOver cuando haya dispositivo. Registrar modelo, versión de SO, versión Expo Go, SDK, fecha, cuenta de prueba (sin contraseña), resultado y evidencia. Nada de esta lista se marca ejecutado por tener código o mocks.

1. Configurar Supabase real con el SQL revisado y los tres gimnasios aportados por el usuario. Iniciar Expo, abrir QR en Expo Go y comprobar que Metro no produce errores.
2. Registrar una cuenta, revisar nombre/correo. Cerrar y abrir la app; comprobar persistencia. Cerrar sesión. Probar credenciales incorrectas y formulario vacío.
3. Buscar por fragmento y acentos. Abrir gimnasio sin reportes: no debe inventar ocupación. Volver usando gesto y botón nativo.
4. Denegar cámara, reintentar y abrir ajustes si está bloqueada. Con permiso, tomar foto sin rostros, cambiar de pestaña y comprobar que la cámara se libera. Volver, repetir la foto, seleccionar nivel y confirmar. Verificar la fila PostgreSQL, JPEG en Storage y hora del servidor.
5. En una segunda cuenta/dispositivo, abrir el mismo gimnasio y observar el reporte en tiempo real. Verificar foto, nivel, historial y resumen. Probar un reporte con más de 60 minutos y comprobar la advertencia de vigencia.
6. Cortar red antes de confirmar: esperar el timeout, cerrar y abrir la app. El pendiente y su foto deben mantenerse. Cambiar de cuenta: no deben aparecer pendientes ajenos. Restaurar red y reintentar; comprobar que no se duplica. Descartar una foto antigua.
7. Crear grupo, compartir código con una segunda cuenta y unirse. Publicar check-in y verificar actividad de ambos. Probar una tercera cuenta sin código: no debe consultar grupo ni actividad. Las pruebas SQL de RLS complementan esta comprobación.
8. Usar TalkBack/VoiceOver en todas las pantallas: etiquetas, orden del foco, botones, cámara, errores y confirmaciones. Comprobar que no se omiten acciones dentro de tarjetas.
9. Activar texto al 200% y mayor tamaño soportado, temas claro y oscuro, rotación y teclado visible. Verificar recortes, desplazamiento, pestañas y objetivos táctiles.
10. Simular fallo de lectura de imágenes o permiso denegado del backend. La app debe mostrar un mensaje sin cerrarse; restaurar la configuración y recargar.

No se han realizado pruebas con usuarios ni encuestas. No se han medido tiempos de arranque, consumo de memoria, latencia, batería ni FPS. Para evaluación posterior: repetir tres veces arranque en frío y carga del listado, anotar red/dispositivo y conservar mediciones sin extrapolarlas a otros equipos.
