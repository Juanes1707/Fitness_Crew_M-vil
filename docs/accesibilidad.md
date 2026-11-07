# Matriz de accesibilidad

Los archivos se indican desde la raíz del repositorio. Resultado «implementado» significa inspección del código; no sustituye una auditoría en dispositivo. La tipografía usa la fuente nativa del sistema, tamaños 17/26 para cuerpo y 30/38 para títulos. No se desactiva `allowFontScaling` ni se limita el multiplicador de fuente. Las áreas de contenido no tienen altura fija; la cámara y fotos sí mantienen un tamaño visual independiente del texto.

| Mejora de accesibilidad | Componente implementado | Archivo | Método de verificación | Resultado |
|---|---|---|---|---|
| Etiquetas del formulario | Field / AuthForm | frontend/src/components/ui.tsx; AuthForm.tsx | RNTL consulta por etiqueta | Automatizado; ver registro de ejecución |
| Roles de botones y encabezados | Button / Copy | frontend/src/components/ui.tsx | RNTL por rol e inspección | Implementado; lectura móvil pendiente |
| Estado deshabilitado, ocupado y seleccionado | Button | frontend/src/components/ui.tsx | RNTL y prueba con lector | Estado ocupado probado; lector pendiente |
| Instrucción de publicación | Button con accessibilityHint | frontend/app/(tabs)/report.tsx | Inspección y TalkBack/VoiceOver | Implementado; audición pendiente |
| Errores anunciables | Notice | frontend/src/components/ui.tsx | RNTL por alert y accessibilityLiveRegion | Error probado; anuncio real pendiente |
| Foto etiquetada | ReportPhoto / vista previa | frontend/src/components/ReportPhoto.tsx; frontend/app/(tabs)/report.tsx | Inspección de accessible y accessibilityLabel | Implementado; lectura móvil pendiente |
| Ocupación sin depender del color | Occupancy | frontend/src/components/ui.tsx | RNTL texto e icono | Automatizado; ver ejecución |
| Contraste del texto | Paletas clara y oscura | frontend/src/constants/theme.ts | Cálculo sRGB por script | Ver docs/verificacion.md; auditoría visual pendiente |
| Tema claro/oscuro/sistema | Profile / useTheme | frontend/app/(tabs)/profile.tsx; frontend/src/hooks/useTheme.ts | Cambio manual y reinicio | Implementado; dispositivo pendiente |
| Texto del sistema | Copy, Field, Button y tab bar | frontend/src/components/ui.tsx; frontend/app/(tabs)/_layout.tsx | Fuente al 200%, retrato/paisaje | Implementado; revisión visual pendiente |
| Áreas táctiles | Button / pestañas | frontend/src/components/ui.tsx; frontend/app/(tabs)/_layout.tsx | RNTL verifica mínimos de Button en ambos ejes; inspección de pestañas | Button mínimo 50×50 probado; medición física pendiente |
| Selector durante publicación | GymPicker / Report | frontend/src/components/GymPicker.tsx; frontend/app/(tabs)/report.tsx | RNTL comprueba disabled mientras se publica | Automatizado; anuncio en lector pendiente |
| Cámara al navegar | Report | frontend/app/(tabs)/report.tsx | RNTL dispara pérdida de foco y comprueba desmontaje de vista previa | Automatizado con cámara mock; dispositivo pendiente |
| Orden de lectura | Screen y grupos de contenido | frontend/src/components/ui.tsx | Recorrer foco en TalkBack/VoiceOver | Orden JSX lógico; recorrido pendiente |
| Carga y confirmación | Loading / Notice | frontend/src/components/ui.tsx | Inspección y prueba de publicación | Implementado; comportamiento móvil pendiente |

No se agrupan tarjetas enteras con `accessible` cuando contienen botones: ello podría ocultar acciones a lectores. Las fotos sí son elementos agrupados con descripción. No se necesita `hitSlop` en botones porque su área ya supera ambos mínimos. La barra de pestañas usa las pestañas JavaScript de Expo Router, con un Stack nativo para pantallas, y requiere comprobar la adaptación a tamaños grandes en el teléfono objetivo.

No se han recibido las mejoras específicas de Fase 2. La matriz cubre el resumen del usuario y deberá ampliarse si los documentos contienen otros compromisos. No se afirma una auditoría WCAG AA completa.
