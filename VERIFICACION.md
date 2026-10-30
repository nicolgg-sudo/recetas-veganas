# Verificación de la primera versión

Fecha: 30 de octubre de 2026.

## Contenido y archivos

- 50 recetas distintas y 50 enlaces originales únicos; 10 por cada una de las cinco categorías.
- 50 fotos JPEG y 23 videos MP4 locales. Comprobadas existencia y firmas de los 73 archivos.
- Ingredientes normalizados sin duplicados dentro de las fichas. Garbanzo seco y de lata conservan identidades distintas. Aceites y especias forman parte del catálogo.
- Catálogo generado con scripts/build-catalog.py y sintaxis de app.js/catalog.js comprobada con Node.

## Pruebas de la interfaz en navegador

- Cada filtro de categoría mostró sus 10 recetas.
- Búsqueda sin tildes encontró ingredientes con tildes.
- Con cuatro ingredientes necesarios de una batida marcados, la receta apareció con cero faltantes sin exigir la decoración opcional.
- Al desmarcar uno, dejó de aparecer con cero faltantes y apareció con tolerancia de uno.
- La despensa y las recetas seleccionadas para compras se conservaron al recargar.
- Favoritos actualizó su contador.
- Dos batidas en compras agruparon guineo en una sola entrada, manteniendo las cantidades por receta.
- Se descargó una copia de seguridad, se rechazó una copia inválida y se restauró la válida conservando una copia anterior.
- Al marcar sal como difícil de conseguir, los pancakes dejaron de pasar el filtro Sin mis difíciles; al desmarcarla, volvieron a aparecer.
- El modo cocina avanzó del paso 1 al 2 y permitió volver a la lista.
- Video local de pancakes reproducido: duración reconocida, reproducción avanzando y sin error del reproductor.
- Las pruebas terminaron sin ingredientes, favoritos o compras de ejemplo marcados. Los utensilios declarados permanecen seleccionados.

## Inicio local

- scripts/launch.py --no-browser inició correctamente el servidor en 127.0.0.1:8766.
- Inicio y catálogo respondieron HTTP 200.
- Lectura parcial de video respondió HTTP 206; rango fuera del archivo respondió 416. Se verificó también lectura desde el final del video.
- Los archivos ajenos a la aplicación, como .git/config, respondieron 404.
- Los scripts Python compilaron sin errores.

## Límites

La verificación funcional se hizo por HTTP local. La herramienta del navegador bloqueó navegar a file://; no se intentó eludir ese bloqueo. Por eso se incluye el inicio por localhost como opción recomendada. La apertura directa del HTML queda preparada pero no verificada en la herramienta.

La validación principal corresponde a laptop. El acceso remoto y la sincronización con iPhone no forman parte de esta versión. Las recetas fueron comprobadas contra sus fuentes, sin afirmar pruebas personales de cocción. Los videos no tienen traducción o subtítulos añadidos.
