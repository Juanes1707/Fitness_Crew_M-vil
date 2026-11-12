# Carga de fotografías — 12 de noviembre de 2026

El usuario confirmó que publicar funciona; se retiraron los cambios incompletos del diagnóstico anterior. No se cambió el contrato de publicación, la cola, Redux de reportes ni SQL remoto.

## Cambios

- ReportPhoto usa Expo Image compatible con SDK 58. Caché en memoria y disco, con clave estable basada en la ruta inmutable de Storage: renovar la URL firmada no obliga a descargar otra vez una imagen ya cacheada. Se conserva la etiqueta accesible y el manejo de error.
- La fotografía del último reporte tiene prioridad alta. Las fotos anteriores se abren con «Ver fotografía del reporte», prioridad baja. El historial de niveles/fechas sigue visible; sus imágenes no compiten con la principal al entrar.
- photoService reutiliza las URLs firmadas durante 50 minutos (validez del servidor: 60) y comparte solicitudes simultáneas. Límite de 200 entradas en memoria. Errores no se cachean y permiten reintentar. Se limpia la caché de firmas al cerrar o cambiar de cuenta; no se convierte el bucket en público.
- Se reserva espacio 4:3 mientras llega la URL para evitar saltos de contenido.

## Evidencia

Antes: la prueba de cuatro accesos al mismo path observó cuatro solicitudes de firma. Después exige una y pasa. La prueba de detalle comprueba que sólo se firma la foto principal al entrar, y que una histórica no se pide hasta pulsar su botón. Se prueban caducidad, limpieza de sesión y recuperación tras un fallo de firma.

Estas pruebas miden solicitudes evitadas, no segundos reales en un teléfono. No se promete un tiempo fijo: la primera descarga de una foto no cacheada sigue dependiendo de tamaño y conexión a Supabase. Los archivos originales existentes no fueron recomprimidos ni reemplazados. Se necesita comparar primera apertura y reapertura en la misma red/dispositivo para cuantificar la mejora.

No se enviaron fotografías ni se alteraron datos de producción. Para recoger el módulo nuevo al probar: detener Metro y ejecutar `npm run start:tunnel`; abrir el QR nuevo con Expo Go SDK 58. El caché propio de las fotos se mantiene aunque el script limpie la caché de Metro.
