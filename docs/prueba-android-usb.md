# Prueba física Android por USB — 7 de noviembre de 2026

Dispositivo: Samsung SM-A566E, Android 16, Expo Go 58.0.5. Proyecto Expo SDK 58. No se almacena el número de serie ni credenciales.

## Resultados observados

- ADB reconoce el dispositivo como `device`, autorizado por el usuario.
- `adb reverse tcp:8081 tcp:8081` conecta el dispositivo al Metro existente del proyecto.
- Apertura mediante `exp://127.0.0.1:8081`: FitCrew muestra la pantalla de acceso, sin aviso de incompatibilidad del SDK.
- Pulsar Iniciar sesión con ambos campos vacíos muestra «Escribe un correo válido».
- Captura de arranque: `evidence/android/01-launch.png`. Jerarquía nativa confirma etiquetas de correo, contraseña, iniciar sesión y crear cuenta. Esto no sustituye una prueba de TalkBack.
- Estado del sistema leído: escala de fuente 1.0, modo oscuro, servicios de accesibilidad desactivados. No se modificaron ajustes del usuario.

## Continuación pendiente

El usuario informó que creó su cuenta e inició sesión directamente en el teléfono. Después se observaron los siguientes resultados:

| Comprobación física | Resultado observado |
|---|---|
| Acceso y catálogo real | Lista autenticada con Athletic Gym Chía y Bodytech; selector de Reportar también contiene Smart Fit. Sin credenciales extraídas del dispositivo. |
| Búsqueda | `Athletic` devuelve Athletic Gym Chía; `Athletic5` muestra el mensaje de cero resultados. |
| Detalle y regreso | Athletic muestra dirección, «Sin reportes disponibles», explicación de ausencia de datos y resumen sin datos; Atrás de Android vuelve al listado. |
| Permiso de cámara | Expo Go mostró el diálogo propio de autorización para FitCrew, pues Android ya tenía permiso para otra experiencia. Después se pudo abrir la cámara. No se considera probado el rechazo del permiso: hubo intervención del usuario durante el diálogo. |
| Sensor y captura | Foto de superficie preparada por el usuario, vista previa accesible y acción «Tomar otra fotografía». No se pulsó publicar. |
| Liberación de cámara | `dumpsys media.camera` muestra cliente Expo activo antes de capturar; después de captura no hay clientes activos. Reapertura seguida de cambio a Gimnasios registra CONNECT/DISCONNECT y vuelve a `Active Camera Clients: []`. |
| Persistencia de sesión | Se ejecutó `am force-stop host.exp.exponent`, se relanzó la URL del proyecto y reapareció el catálogo autenticado sin pedir contraseña. Fue necesario volver a traer la experiencia al primer plano; no se observó un crash de FitCrew. |
| Texto al 200% | Reprodujo recortes de pestañas en la barra original. Tras ajustar altura según fontScale y safe area, etiquetas multilínea e iconos decorativos sin escalado, se observan los cuatro nombres completos. La prueba es visual, no una garantía de todas las pantallas o escalas. |
| Temas | Listado observado en oscuro y claro; se restauró la preferencia original «Usar tema del dispositivo». Escala del sistema restaurada a 1.0. |

Evidencia visual: `evidence/android/05-font-200.png` (antes), `06-font-200-fixed.png` (después) y `07-light.png` (listado claro). El archivo `03-permission.png` contiene la cámara ya abierta, no el diálogo: el estado cambió entre el dump y la captura. `04-restart.png` muestra Ajustes durante el cambio de primer plano, y no prueba un fallo de arranque.

Pendientes: rechazo/bloqueo de permisos sin intervención simultánea, TalkBack con validación auditiva, rotación y revisión completa de todas las pantallas a tamaño máximo, cola sin conexión, publicación real y observación por otra cuenta, grupos. La publicación debe usar información y foto reales del gimnasio, o un entorno de prueba separado. No se publicaron reportes ni se subieron fotografías. La captura de prueba sólo se usó como vista previa y se reinició la experiencia después.

## Verificación local de esta sesión

`npm run typecheck`, `npm run lint`, `npm test` (12 suites, 73 pruebas), `npm run test:security` (7 pruebas PostgreSQL embebido) y `npm run check:expo` finalizaron correctamente. Estos resultados se distinguen de las comprobaciones físicas descritas arriba.

## Reconexión

Con Metro en el puerto 8081 y el dispositivo autorizado:

```powershell
adb devices -l
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent
```

La redirección USB debe repetirse después de desconectar el dispositivo o reiniciar ADB.
