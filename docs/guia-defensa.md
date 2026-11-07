# Guía breve para defender FitCrew

El proyecto usa **Supabase**, por decisión confirmada del usuario. Las referencias a Firebase de la plantilla de requisitos se corresponden con Supabase Auth, PostgreSQL, Storage y Realtime. No se cambió React Redux ni Expo SDK 58.

## Navegación

`frontend/app/_layout.tsx` envuelve la aplicación en el `Provider` de React Redux, restaura la sesión y define el `Stack` de Expo Router. `Stack.Protected` protege las pantallas privadas y redirige explícitamente a `/login` al perder la sesión; esto evita el bucle de redirecciones reproducido en SDK 58. `app/index.tsx` dirige a login o a las pestañas según el perfil de Redux. El layout de `(tabs)` declara Gimnasios, Reportar, Mi crew y Perfil. El detalle recibe el ID en `gym/[id].tsx`.

La prueba `tests/navigation.test.tsx` usa las rutas y componentes reales con servicios mockeados; no equivale a una prueba física ni a un inicio de sesión real en Supabase.

## Redux

`frontend/src/store/index.ts` registra los slices `auth`, `gyms` y `preferences`. El primero guarda perfil y estado inicial; el segundo almacena catálogo, reportes por gimnasio y errores; el tercero selecciona tema. Los hooks tipados están en `frontend/src/hooks/store.ts`.

Una pantalla lee datos con `useAppSelector`. Los listeners despachan `gymsReceived` y `reportsReceived`; la sesión despacha `sessionChanged`. No se guardan contraseñas, cámaras, blobs ni clientes Supabase en Redux. Los formularios usan `useState` porque su estado sólo pertenece a la pantalla.

## Comunicación con Supabase

`backend/services/supabase.ts` inicializa el SDK con las variables públicas de `frontend/.env`. Auth conserva y renueva la sesión; RLS comprueba permisos en el servidor, independientemente de lo que muestre la interfaz. Los servicios reciben parámetros sencillos y devuelven promesas o funciones de cancelación.

`watchQuery.ts` recibe avisos Realtime y vuelve a consultar bajo RLS. Recupera datos al activar la aplicación y mediante refresco periódico; al salir cancela canales, eventos y temporizadores.

## Publicación de un reporte

`frontend/app/(tabs)/report.tsx` toma gimnasio, nivel y foto. Antes de publicar, `pendingService.ts` copia la imagen al directorio documental y guarda sus metadatos en AsyncStorage, separados por UID. Sólo después se llama a `reportService.ts`.

El servicio verifica la sesión, comprueba si el ID ya está publicado, sube un JPEG como ArrayBuffer al bucket privado e inserta la fila en `reports`. PostgreSQL asigna la fecha; el cliente no tiene permiso para escribirla. Ante un error se conserva el pendiente. El reintento usa el mismo ID para evitar duplicados y sólo se elimina localmente después de confirmar éxito.

La cámara se libera al abandonar la pestaña. Un permiso denegado se comunica mediante alerta; si está bloqueado se ofrece abrir ajustes. Los avisos recuerdan evitar rostros sin consentimiento.

## Historial y privacidad

`gymService.ts` consulta hasta cien reportes por gimnasio, ordenados por fecha. El detalle distingue carga, error, resultado vacío y último reporte. `occupancy.ts` marca como desactualizados los reportes de más de una hora y calcula un promedio descriptivo por franjas UTC−5. No predice ocupación.

`friendService.ts` usa RPC transaccionales para crear/unirse al grupo y consultas filtradas para check-ins. El SQL en `backend/supabase/migrations/001_fitcrew.sql` valida identidad, membresía, cupo y permisos. Los clientes no pueden modificar directamente los integrantes. Las pruebas RLS usan PostgreSQL embebido y no reemplazan dos sesiones reales.

## Accesibilidad y evidencias

`frontend/src/components/ui.tsx` concentra etiquetas, roles, estado seleccionado/ocupado, alertas, tipografía adaptable y controles de al menos 50×50. El selector de gimnasio expone disabled mientras hay una publicación o check-in en curso. `ReportPhoto.tsx` describe las imágenes. Las paletas se prueban por contraste; el detalle y ocupación incluyen texto y símbolos. `docs/accesibilidad.md` separa implementación, pruebas automáticas y auditoría física pendiente.

Para comprobar el proyecto: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:security`, `npm run check:expo` y `npm run test:backend`. Este último sólo verifica conectividad, acceso anónimo bloqueado y rechazo de credenciales sintéticas incorrectas; no crea usuarios ni reportes.

El resultado más reciente y la siguiente tarea están en `docs/progress.md`. No se han inventado encuestas, métricas de dispositivo ni participación de integrantes.
