# Estado de la rúbrica oficial — 9 de noviembre de 2026

**Resultado físico posterior:** la conexión USB se resolvió y se comprobó continuidad de sesión al migrar, persistencia después de force-stop y salida que permanece después de reiniciar, con SecureStore real en Android. Ver [prueba-sesion-segura-android.md](prueba-sesion-segura-android.md). Las menciones posteriores a ADB vacío describen el bloqueo inicial, ya resuelto. Renovación nativa y E2E restante siguen pendientes.

Actualización física de cierre: el usuario confirmó un anuncio correcto de TalkBack en Ver Athletic Gym Chía después de superar el tutorial; es una comprobación parcial. Cola offline: guardado, recuperación tras force-stop y descarte comprobados sin red; se eliminó el pendiente y terminó el proceso antes de restaurar Internet. No hubo publicación remota de la captura de escritorio. El usuario aclaró que no estaba en un piloto, por lo que publicación real/segunda cuenta y grupos permanecen pendientes. Internet y accesibilidad restaurados.

Fuente: PDF de siete páginas «Proyecto de Curso: Fase 3 (Entrega Final Definitiva)», aportado por el usuario. Pesos: documento 20%, funcionalidad/repositorio 30%, presentación 10%, defensa individual 40%. Supabase está permitido expresamente. No se exige publicación en tienda ni una cantidad específica de encuestas o métricas.

| Requisito | Estado y siguiente acción |
|---|---|
| Informe en cinco secciones | Existe en informe-final.md; corregidos estados anteriores a la prueba USB e incorporada sesión protegida. Falta cierre con evidencia E2E final. |
| UVP, personas y problema validado | Propósito descrito; recuperar Fase 1 para personas con necesidades de accesibilidad y evidencia real del problema. No inventar entrevistas. |
| 3–4 competidores y diferenciadores | Falta recuperar/actualizar matriz de Fase 1 y relacionar brechas con implementación final. |
| Arquitectura, componentes, Redux, navegación, datos | Implementados y documentados. Sesión nativa ahora protegida con SecureStore; prueba nativa del cambio pendiente. |
| Accesibilidad WCAG AA y trazabilidad Fase 2 | Matriz técnica existente; falta Fase 2 y auditoría completa de lector/foco/escalado. No declarar conformidad global por pasar Jest. |
| Flujos reales sin mocks en producción | Integración Supabase real. Acceso/catálogo/cámara comprobados en Android el 7; publicación/Realtime/grupos/offline E2E pendientes. |
| Código tipado y README reproducible | TypeScript, lint y compatibilidad pasan. Se añadió SecureStore con lockfile y plugin. |
| Git e historial equitativo | Existe remoto GitHub; dos commits de un autor observados el 9. Falta evidencia de contribuciones reales del resto. No fabricar historial. No se ha auditado todo el historial por secretos en esta sesión. |
| Referencias APA/IEEE y diagramas renderizados | Bibliografía técnica normalizada en informe; faltan referencias competitivas. Comprobar Mermaid en plataforma y maquetación sugerida de 5–8 páginas. |
| Presentación y demo | Guion de recorrido en guion-demo.md; material visual final y ensayo pendientes. |
| Defensa individual | Guia-defensa.md y defensa-tecnica.md disponibles. Cada integrante debe practicar explicación y ajuste en vivo de cualquier módulo. |

## Cambio de almacenamiento de sesión

`backend/services/sessionStorage.ts` implementa el contrato de storage del SDK; `supabase.ts` lo usa sólo en Android/iOS. Cada fragmento se guarda cifrado por SecureStore, con accesibilidad WHEN_UNLOCKED_THIS_DEVICE_ONLY. No hay biometría ni secretos de servidor. La referencia de generación se confirma al completar la escritura para conservar la sesión previa si falla una renovación. Sesiones grandes se dividen por puntos Unicode para no exceder 1600 bytes por entrada. Límite defensivo: 128 fragmentos (51 200 puntos Unicode). Los errores nativos se propagan; no hay fallback a almacenamiento sin cifrar.

La primera lectura migra la sesión anterior sin cambiar la clave del SDK ni la cuenta. Sólo después del commit seguro elimina la copia AsyncStorage. Si falla ese borrado, se reintenta en la próxima lectura y no se devuelve éxito silencioso. Sesión incompleta/corrupta se descarta para permitir acceso nuevo, sin restaurar una copia legacy obsoleta. El cierre elimina legacy, manifiesto y fragmentos. La cola y el tema siguen usando AsyncStorage; web conserva almacenamiento estándar del SDK, sin promesa de cifrado nativo.

Limitación: una interrupción abrupta antes de publicar el manifiesto puede dejar fragmentos cifrados huérfanos. No se restauran sin referencia; no hay recolector de generaciones huérfanas. SecureStore es almacenamiento local, no reemplaza RLS. La desinstalación/backup difiere entre Android/iOS: no prometer persistencia después de reinstalar. El plugin configura la exclusión de backup Android para compilaciones propias; en Expo Go lo gestiona el contenedor.

## Evidencia de esta sesión

- Prueba inicial del adaptador falló por ausencia del módulo; después pasaron 10 pruebas nuevas: Unicode/sesión grande, migración y fallos, renovación con SDK Supabase real y red simulada, eliminación y recuperación de corrupción. No se ejecutó un Keystore real en Jest.
- Cuatro pruebas nuevas de Mi crew; una reprodujo que un error al consultar membresía ofrecía incorrectamente crear/unirse. Se separó membresía desconocida de ausencia confirmada. Tras corregir, pasan creación, invitación fallida, check-in, limpieza y recuperación.
- Total: 14 suites / 87 pruebas de aplicación; 7 SQL PGlite. Typecheck, lint y check:expo aprobados. Bundle Android/iOS/web completado. Smoke alojado: Auth accesible, gyms protege acceso anónimo y login incorrecto devuelve 400, sin creación de cuentas ni escrituras.
- ADB no muestra dispositivos, incluso reiniciado. Windows sólo encontró el A56 en Bluetooth. No se cuentan pruebas físicas nuevas; siguen vigentes las del 7, salvo que la persistencia ahora debe repetirse por el cambio a SecureStore.

## Próximo recorrido físico

1. Reconectar USB de datos y aceptar RSA; iniciar Metro SDK 58. No borrar datos ni reinstalar Expo Go: se necesita verificar migración de la sesión existente.
2. Abrir con la misma URL/proyecto, comprobar acceso conservado, force-stop y reapertura. Comprobar renovación sin imprimir tokens y salida seguida de reapertura sin sesión. Si no había sesión anterior, migración queda sin prueba física aunque el acceso nuevo funcione.
3. Publicación sólo con foto/ocupación real del piloto, o entorno de pruebas separado. Verificar desde otra cuenta. No publicar la foto de escritorio usada para captura previa.
4. Probar cola tras cortar Internet (Metro por USB puede seguir disponible), reinicio, reintento sin duplicados y separación por cuenta. Probar grupos y privacidad con dos/tres cuentas.
5. Ejecutar TalkBack y revisión completa de fuente grande/rotación/teclado. Registrar resultado por pantalla; restaurar ajustes.

No desplegar SQL ni crear datos ficticios para cubrir estos puntos. Los documentos de Fase 1/2 siguen siendo necesarios para cerrar trazabilidad; la rúbrica Fase 3 ya está disponible.
