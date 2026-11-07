# Configurar FitCrew con Supabase y Expo Go

El proyecto conserva `frontend/` para presentación y `backend/` para servicios y SQL. Se conecta directamente al SDK JS de Supabase desde Expo Go; no requiere desplegar un servidor propio. El usuario ya creó el proyecto y aportó una URL y Publishable key, guardadas en `frontend/.env` sin incluirlas en la documentación ni en Git.

## 1. Preparar la base de datos

En tu proyecto Supabase abre SQL Editor → New query. Copia **todo** `backend/supabase/migrations/001_fitcrew.sql` y pulsa Run. «Success. No rows returned» es la respuesta esperada: el archivo define estructuras y permisos, no consulta filas.

El script crea `gyms`, `reports`, `groups`, `profiles`, `checkins`, índices, RLS, funciones `create_group` y `join_group`, el bucket privado `report-photos` y Realtime para gimnasios/reportes/grupos/check-ins. Puede repetirse: no borra registros. Para proyectos con datos ajenos a FitCrew, revisa el efecto de los grants antes de usarlo.

El usuario ejecutó este paso y aportó una captura de éxito. La comprobación HTTP posterior encontró `gyms` y verificó que el acceso anónimo está bloqueado. Esto no demuestra todavía un flujo de usuario autenticado.

## 2. Cargar los gimnasios reales

Abre otra consulta y ejecuta `backend/supabase/seed-gyms.sql`. Usa los datos proporcionados por el usuario:

| id | name | address |
|---|---|---|
| smartfit-central-park-chia | Smart Fit - Central Park Chía | Cra. 10 #6-130, Chía. |
| bodytech-plaza-mayor-chia | Bodytech Plaza Mayor Chía | Centro Comercial Plaza Mayor, Local 121, Av. Pradilla No. 5 - 31 Este, Chía. |
| athletic-gym-chia | Athletic Gym Chía | Cra. 1 #5-30, Chía. |

El usuario ejecutó este paso y aportó una captura con las tres filas esperadas. El resultado muestra las filas guardadas. Repetirlo actualiza esos tres establecimientos por ID. No añade reportes ni estados de ocupación. En la aplicación aparecerá «Sin reportes» hasta que una persona publique uno.

## 3. Elegir la confirmación de correo

En Authentication, localiza el proveedor Email en Sign In / Providers y comprueba que esté habilitado. La consulta de configuración del proyecto indicó que el proveedor y la confirmación de correo estaban activos.

Con confirmación activa: regístrate con un correo al que tengas acceso, abre el mensaje, confirma y vuelve manualmente a iniciar sesión en FitCrew. No se inicia sesión automáticamente por abrir el enlace. El MVP no implementa un callback móvil de confirmación; el destino web configurado en Supabase no es una pantalla de la app.

Para facilitar una demostración en un proyecto exclusivo de pruebas puedes desactivar Confirm email y guardar antes de registrar las cuentas. La pantalla de registro admite ambas configuraciones. Si una cuenta ya quedó pendiente, confírmala o revisa su estado en Authentication → Users. Si aparece un límite de envío de correos, espera o revisa el proveedor SMTP; la app muestra el error sin cerrar la sesión inesperadamente.

## 4. Variables locales

El archivo `frontend/.env` ya contiene los dos valores públicos aportados por el usuario:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Para otro checkout, copia `.env.example` y completa los valores desde Connect / API Keys o Project Settings, según la interfaz del panel. La variable acepta Publishable key o anon key clásica. No uses la clave secret/service_role ni la contraseña de la base de datos. El cliente rechaza claves administrativas. No necesitas registrar apps nativas ni usar archivos Google Services.

## 5. Iniciar Expo

Abre PowerShell en la carpeta principal del proyecto:

```powershell
npm ci
npm exec --workspace @fitcrew/frontend -- expo start --clear
```

En este equipo las dependencias ya están instaladas; `npm ci` sólo hace falta al reconstruir la instalación. Espera a ver «Metro waiting» y el QR. Conecta celular y computador a la misma Wi-Fi.

En Android abre Expo Go y escanea el QR. En iPhone usa la cámara para abrirlo en Expo Go. Este proyecto requiere SDK 58; si aparece un error de versión consulta [Expo Go](https://expo.dev/go) y la [guía oficial](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/). Para desarrollo en iOS, inicia sesión en Expo CLI y Expo Go con la misma cuenta si la versión instalada lo solicita.

Si el teléfono no conecta: comprueba la Wi-Fi, evita redes que aíslen dispositivos y permite acceso local de Expo Go. Si Windows muestra una solicitud de firewall, permite Node en tu red privada; no desactives el firewall. Otra opción es `npm exec --workspace @fitcrew/frontend -- expo start --tunnel`, que puede solicitar instalar la utilidad de túnel. Reinicia Metro después de modificar `.env`.

## 6. Primera prueba

1. Crea una cuenta, confirma el correo si está activo y entra.
2. Verifica los tres gimnasios cargados y busca «Chía».
3. En Reportar selecciona gimnasio, nivel y foto sin rostros; confirma.
4. Comprueba el reporte y la imagen en el detalle. En el panel verás la fila en `reports` y el JPEG en Storage → report-photos → UID.
5. Usa otra cuenta para comprobar la actualización. Crea un grupo, comparte su código y revisa los check-ins desde ambos integrantes.
6. Prueba pérdida de red, reinicio y reintento de un pendiente; el ID debe permanecer igual.

## Diagnóstico

```sh
npm run check:backend
```

Este comando consulta configuración pública Auth y comprueba acceso anónimo denegado a `gyms`. No sustituye las pruebas con sesión. Un `PGRST205` indica que falta el esquema o no ha aparecido aún en la caché de la API. «No tienes acceso» con sesión requiere revisar que se ejecutó la migración y que el usuario está autenticado. Un fallo de foto requiere comprobar bucket, política de ruta propia, MIME JPEG y tamaño menor a 5 MiB.

No desactives RLS para resolver un error. El checklist completo de dispositivo está en `docs/pruebas-manuales.md`.
