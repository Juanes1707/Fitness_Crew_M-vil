# FitCrew

Aplicación académica para consultar y reportar la ocupación de tres gimnasios piloto de Chía y compartir check-ins con un grupo privado. Utiliza Supabase real; no simula sesiones, fotografías ni reportes. El usuario autorizó sustituir Firebase y confirmó que el profesor permite elegir el backend.

## Organización

```text
frontend/                     Presentación y estado de interfaz
  app/                        Expo Router: acceso, cuatro pestañas y detalle
  src/components/             Controles accesibles, formularios e imágenes
  src/store/                  Redux Toolkit: sesión, gimnasios/reportes y tema
  src/hooks/                  Hooks tipados, tema y reloj de vigencia
  .env.example                URL y clave pública Supabase
backend/                      Integración y lógica de datos
  services/                   Supabase Auth, consultas, fotos, grupos y pendientes
  types/                      Modelos compartidos
  utils/                      Validación, errores, resumen de ocupación y timeout
  supabase/migrations/        SQL: tablas, RLS, funciones, bucket y Realtime
  supabase/seed-gyms.sql       Los tres gimnasios indicados por el usuario
  scripts/                    Comprobación de conexión sin escribir datos
  tests/                      Pruebas SQL en PostgreSQL embebido
 tests/                       Pruebas Jest de aplicación
 docs/                        Configuración, informe, accesibilidad y defensa
```

Los servicios de `backend/services` usan el SDK JS dentro de la aplicación. Supabase aloja Auth, PostgreSQL, Storage y Realtime. Las políticas RLS y permisos SQL constituyen la autorización remota: separar carpetas no convierte el código cliente en un servidor confiable. No hay un segundo proceso Node que debas iniciar. Redux permanece en frontend porque organiza estado de la interfaz.

## Instalar y ejecutar

Requiere Node 22.13 o superior de la línea 22, Node 24.3 o superior de la línea 24, o Node 26+, npm y Expo Go compatible con SDK 58. Se utiliza Node 24.18.0 en este equipo.

```sh
npm ci
npm start
```

Instala una sola vez desde la raíz: hay dos npm workspaces y un único lockfile. Stack: React Native 0.88, React 19.3, TypeScript, Expo SDK 58, Expo Router 58, Redux Toolkit/React Redux, Supabase JS, Camera, FileSystem, AsyncStorage y StyleSheet. No requiere módulos Firebase nativos, EAS ni una compilación de desarrollo para estos flujos.

## Configurar Supabase

La guía detallada está en [docs/configurar-supabase.md](docs/configurar-supabase.md).

1. Crea un proyecto Supabase. No necesitas registrar apps Android/iOS ni descargar archivos nativos.
2. En SQL Editor ejecuta **todo** `backend/supabase/migrations/001_fitcrew.sql`. Crea las cinco tablas, índices, permisos explícitos, políticas RLS, RPC de grupos, bucket privado `report-photos` y publicación Realtime. No elimina datos al reejecutarlo. Revisa el SQL antes de usarlo en un proyecto con información previa.
3. Ejecuta `backend/supabase/seed-gyms.sql` para cargar Smart Fit - Central Park Chía, Bodytech Plaza Mayor Chía y Athletic Gym Chía, con direcciones proporcionadas por el usuario. El script muestra las filas resultantes. No crea reportes ficticios.
4. En Authentication verifica que el proveedor Email esté habilitado. Con Confirm email activo, el registro muestra instrucciones para confirmar; después vuelve manualmente a iniciar sesión. Para un proyecto exclusivo de pruebas puedes desactivar Confirm email. El MVP no hace retorno automático desde enlaces de correo.
5. Copia `frontend/.env.example` a `frontend/.env` sólo si este último no existe y completa:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

La variable de clave también admite una anon key JWT clásica. Nunca uses `sb_secret_`, `service_role`, la contraseña PostgreSQL ni una cadena de conexión administrativa. Las claves públicas se empaquetan en el cliente; la privacidad depende de RLS. `.env` está excluido de Git. En este checkout ya se guardaron los valores públicos aportados por el usuario.

6. Reinicia Metro después de cambiar las variables:

```sh
npm exec --workspace @fitcrew/frontend -- expo start --clear
```

7. Conecta teléfono y computador a la misma Wi-Fi y escanea el QR con Expo Go (Android) o la cámara del iPhone. Si aparece incompatibilidad, instala la versión correspondiente a SDK 58 desde [Expo Go](https://expo.dev/go); [documentación de compatibilidad](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/). Windows no ejecuta el simulador iOS: usa un dispositivo físico o un Mac. Si se solicita acceso de red local, concédelo para conectar con Metro.

`npm run web` permite revisar la interfaz, pero los reportes con foto durable usan FileSystem nativo y se validan en Android/iOS. El criterio de aceptación requiere Expo Go en un teléfono.

## Funciones y reglas sencillas

- Registro, acceso, cierre de sesión local y restauración con Supabase Auth y AsyncStorage. El token se renueva mientras la aplicación nativa está activa.
- Gimnasios desde PostgreSQL, búsqueda sin distinguir acentos, detalle e historial. Sin reportes se muestra ausencia de información.
- Cámara, vista previa y confirmación; JPEG menor a 5 MiB subido como ArrayBuffer a Storage; fila creada después de la foto con fecha asignada por PostgreSQL.
- Reportes inmutables e ID UUID estable: un reintento confirmado no duplica datos. La foto ya subida se reutiliza si hubo un fallo parcial.
- Vigencia de 60 minutos; pasado ese límite se advierte que la ocupación actual no está disponible. Resumen de hasta 100 reportes: 0/1/2 para Vacío/Medio/Lleno y promedio redondeado por franjas UTC−5. Historial visual por tandas de diez.
- Un grupo activo por usuario, máximo veinte integrantes, código UUID de invitación y check-ins privados. Crear/unirse son transacciones SQL. No hay chat, expulsión, revocación ni administración. El código permite incorporarse: compártelo sólo con invitados.
- Realtime avisa de cambios; las consultas posteriores vuelven a pasar por RLS. Se refresca también al recuperar la app y cada treinta segundos para recuperar cortes. Se cancelan canales y temporizadores al salir.
- Hasta cinco reportes pendientes por cuenta/dispositivo, conservando fotos locales. Reintento manual con la misma cuenta. Un timeout no cancela una escritura ya enviada; el ID permite reconciliar un éxito tardío. La fecha pública es publicación, no captura: descarta fotos antiguas. Puede quedar una foto huérfana si no se completa el reintento; no hay limpieza remota automática.

Las fotos de ocupación son consultables por cuentas autenticadas. El bucket es privado y genera URLs firmadas de una hora; esos enlaces permiten ver la foto a quien los reciba mientras sean válidos. La actividad de grupos no contiene fotografías y se protege por membresía.

## Accesibilidad y pruebas

Temas claro/oscuro/sistema, tipografía adaptable, botones de 50 unidades, etiquetas, estados seleccionados/ocupados, alertas y niveles con texto e icono. Matriz: `docs/accesibilidad.md`. No se declara conformidad WCAG AA sin auditoría móvil.

```sh
npm run typecheck
npm run lint
npm test
npm run test:security
npm run check:expo
npm run bundle
npm run check:backend
npm run test:backend
```

`test:security` usa PostgreSQL embebido PGlite, sin Docker, Java ni credenciales externas. Evalúa el SQL real bajo roles y RLS; reproduce sólo `auth.uid`, usuarios y el esquema mínimo Storage. No sustituye una prueba de los servicios alojados. Jest utiliza mocks exclusivamente en pruebas. `check:backend` sólo consulta endpoints públicos y comprueba que `gyms` existe y bloquea acceso anónimo; no crea cuentas ni obtiene datos privados. En entornos Node 24 con proxy puede necesitar `node --use-env-proxy backend/scripts/check-connection.mjs`.

Resultados ejecutados: `docs/verificacion.md`. Pruebas físicas pendientes: `docs/pruebas-manuales.md`.

`npm run test:backend` añade una comprobación real del rechazo de credenciales incorrectas usando una identidad sintética. No registra cuentas, no envía correos ni publica reportes. Esta prueba no equivale a un acceso correcto ni al flujo completo en Expo Go.

## Documentación y límites

- [docs/CONTEXTO-TRASPASO.md](docs/CONTEXTO-TRASPASO.md): punto de entrada para un compañero; decisiones, implementación, pruebas aprobadas y pendientes para continuar sin rehacer trabajo.
- `docs/informe-final.md`: cinco secciones del informe académico, actualizadas a Supabase.
- `docs/defensa-tecnica.md`: responsabilidades, entradas, errores y accesibilidad por módulo.
- `docs/guia-defensa.md`: recorrido breve de navegación, Redux, Supabase, reportes y archivos clave para la sustentación.
- `docs/progress.md`: estado de cada módulo, correcciones y siguiente tarea para continuar la sesión.
- No se encontraron los PDF de propuesta, rúbrica ni compromisos de Fase 2. Se utilizó el texto del usuario y su autorización posterior de migración.
- Las cuentas y datos de una eventual instalación Firebase no se transfieren automáticamente. La aplicación anterior no había sido validada en un backend configurado. Los pendientes antiguos permanecen vinculados a su UID original; no se reasignan a otras cuentas.
- Las pruebas automatizadas y compilación no equivalen a verificación de cámara, accesibilidad o dos dispositivos. Sigue pendiente probar el flujo completo en Expo Go.

Referencias: [Supabase Auth para React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native), [uploads React Native](https://supabase.com/docs/reference/javascript/storage-from-upload), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
