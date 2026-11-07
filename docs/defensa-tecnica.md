# Guía de defensa técnica — Supabase

| Módulo y archivo | Qué hace / entradas | Estado Redux | Comunicación y errores | Accesibilidad |
|---|---|---|---|---|
| frontend/app/_layout.tsx | Restaura sesión y protege rutas | auth.user/ready; gyms.items/reports/errors | watchAuth, consultas y canales; cancela al salir | Screen, Notice, Loading |
| frontend/src/components/AuthForm.tsx | Correo, contraseña y nombre opcional | Perfil sólo si Supabase devuelve sesión; formulario local | login/signUp; confirmación de correo, validación, timeout y errores | Etiquetas, secureTextEntry, estado ocupado y avisos |
| backend/services/authService.ts | Mapea User a uid/email/name | Ninguno, no importa Redux | Supabase Auth; eventos síncronos, restauración y renovación según AppState | Propaga errores a la pantalla |
| frontend/app/(tabs)/index.tsx | Búsqueda por nombre | Lee gimnasios e informes | gymService consulta PostgreSQL | Búsqueda etiquetada y niveles con texto |
| frontend/app/gym/[id].tsx | Último reporte, historial de diez en diez y resumen | Lee reportes por ID | watchReports; fotos mediante URL firmada | Imagen etiquetada, aviso de vigencia y scroll |
| frontend/app/(tabs)/report.tsx | Gimnasio, nivel, cámara, confirmación y pendientes | Lee sesión/gimnasios; borrador local | Copia imagen local, publica; conserva pendiente ante fallos | Permiso de cámara, aviso de rostros, selección y confirmaciones |
| backend/services/reportService.ts | Recibe PendingReport con UUID estable | Ninguno | Lee ID, sube ArrayBuffer JPEG a bucket privado e inserta fila sin fecha cliente; maneja conflictos | No renderiza; propaga fallos |
| backend/services/watchQuery.ts | Tabla, consulta, callback y filtro | Ninguno | Realtime, refetch bajo RLS, recuperación cada 30 s y AppState; cancela recursos | Errores visibles por Notice |
| frontend/app/(tabs)/friends.tsx | Crear/unirse y gymId para check-in | Lee sesión/gimnasios; grupo local | RPC transaccional y consultas filtradas; RLS valida membresía | Campos, botones y avisos |
| frontend/app/(tabs)/profile.tsx | Perfil y tema | preferences.theme | AsyncStorage y signOut local | Texto adaptable y selección accesible |
| backend/utils/occupancy.ts | Reportes con fecha en milisegundos | Ninguno | Regla pura: 60 min, promedio por franja UTC−5 | Descripciones independientes del color |

Redux sólo almacena datos serializables: uid, nombre, correo y fechas numéricas. No guarda contraseñas, tokens, clientes Supabase, blobs ni cámaras. Los formularios y pendientes pertenecen a su pantalla. El SDK conserva la sesión; Redux conserva el perfil que la interfaz necesita.

En PostgreSQL se usa snake_case; los servicios lo convierten a los modelos camelCase de las pantallas. El ID de un reporte se crea una vez y se conserva al reintentar. `created_at` lo asigna la base de datos: el rol authenticated no tiene permiso de insertar esa columna. No se usa upsert para reportes o fotografías. El conflicto de ID se comprueba antes de considerarlo publicado.

RLS decide qué filas puede leer y crear cada usuario. `gyms` sólo tiene lectura autenticada. `reports` exige autor propio y foto existente. `groups` se limita a sus integrantes; `checkins` exige membresía y autoría. `profiles` sólo muestra el grupo de la propia cuenta. Las funciones SECURITY DEFINER `create_group` y `join_group` son necesarias para cambiar membresía sin permitir UPDATE directo; verifican auth.uid, un grupo activo y cupo, bloquean las filas concurrentes, fijan search_path y sólo conceden ejecución a authenticated.

Para añadir un gimnasio: editar la carga SQL administrativa, no la interfaz. Para cambiar niveles: types, etiquetas, CHECK SQL y promedio. Para modificar vigencia: isRecent y su prueba de frontera. Para modificar apariencia: paletas y pruebas sRGB. Para demostrar privacidad: ejecutar test:security y después repetir con dos sesiones reales.

No se atribuyen commits ni participación a integrantes que no hicieron esos cambios.
