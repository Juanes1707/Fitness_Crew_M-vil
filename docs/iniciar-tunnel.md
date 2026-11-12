# Iniciar FitCrew con ngrok desde otras redes

Actualización: 12 de noviembre de 2026. Se conserva SDK 58. Expo se actualizó a 58.0.24 y se alinearon Constants 58.0.16, Crypto 58.0.8, Linking 58.0.17, Router 58.0.31, SecureStore 58.0.3 y StatusBar 58.0.5. `@expo/ngrok` 4.1.3 quedó como dependencia de desarrollo de la raíz. No se requiere el antiguo paquete global expo-cli.

## Uso desde VS Code

```powershell
cd "C:\Users\Juan Esteban\OneDrive - Universidad de la Sabana\Desktop\Fitness_Crew_Móvil"
npm run start:tunnel
```

El script ejecuta `expo start --go --tunnel ngrok --clear` en frontend. En SDK 58 el proveedor debe indicarse como `ngrok`; `--tunnel` por sí solo puede seleccionar el túnel de Expo. En una copia nueva ejecutar primero `npm ci` desde la raíz. No reinstalar ni borrar los datos de Expo Go: utilizar la versión compatible con SDK 58.

Esperar «Tunnel connected» y «Tunnel ready» y escanear el QR de ESA sesión con Expo Go. Cada celular puede estar en otra Wi-Fi o usar datos móviles. Computador y celulares necesitan Internet; dejar la terminal abierta. Ctrl+C detiene la sesión. Una URL antigua no garantiza acceso a un servidor nuevo.

Si el puerto 8081 está ocupado por otra sesión, detenerla con Ctrl+C en su terminal si ya no se usa, o aceptar otro puerto. No terminar todos los procesos Node. Ngrok puede usar otro puerto de Metro.

`npm start` sigue disponible para conexión habitual por LAN. No se modifica frontend/.env ni Supabase. El túnel comunica el celular con Metro; los servicios Supabase alojados conservan su conexión independiente.

## Comprobación ejecutada

TypeScript, lint, 14 suites/87 pruebas de aplicación, 7 pruebas SQL y check:expo aprobados tras instalar los parches. Npm detectó un directorio temporal bloqueado durante limpieza, pero la instalación terminó con código 0 y las dependencias actuales quedaron resueltas.

La sesión de prueba arrancó en 8082 porque 8081 estaba ocupado. Metro local respondió y `/_expo/open?platform=android` devolvió runtime expo y URL exps pública. Ngrok informó conexión y túnel listo. La consulta externa desde este equipo falló con ECONNRESET en HTTPS y HTTP 503; no se contó como acceso externo aprobado. Se solicitó al usuario comprobar desde un celular en otra red. El túnel depende de la red y del servicio ngrok; no se declara accesibilidad remota sólo por el mensaje «ready».

Fuentes: [Expo CLI](https://docs.expo.dev/more/expo-cli/), [SDK 58 y proveedores de túnel](https://expo.dev/changelog/sdk-58).
