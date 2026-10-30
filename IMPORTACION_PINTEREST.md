# Importación del tablero personal

30 de octubre de 2026. Tablero: https://uk.pinterest.com/nikipjitap/vegan/

## Resultado

- 23 pines inventariados en la sesión de Chrome, con 23 identificadores únicos.
- 23 fichas incorporadas: 8 conservan las medidas publicadas y 15 contienen medidas propuestas.
- La usuaria autorizó expresamente crear y guardar adaptaciones para los videos sin cantidades completas. Cada adaptación se identifica como **Medidas propuestas · Sin probar**, explica los detalles añadidos y mantiene el video de referencia.
- 23 fotos y 23 videos descargados. Los videos conservan su idioma original.
- Catálogo total: 73 recetas, 73 fotos y 46 videos. Los ingredientes nuevos se incorporan sin marcarse automáticamente como disponibles.
- Sección **Mi tablero**, filtros de medidas publicadas/adaptaciones y filtro **Procedencia** en el recetario y en Qué puedo cocinar.

## Comprobaciones realizadas

- El inventario contiene exactamente 23 pines y cada uno apunta a una ficha existente, sin duplicados.
- Compilación del catálogo y sintaxis JavaScript correctas.
- Los 23 videos se decodificaron completos con FFmpeg, sin errores; las 23 fotos tienen firma JPEG válida.
- La interfaz muestra 23 fichas en Mi tablero, 8 en medidas publicadas y 15 en adaptaciones.
- Búsqueda sin tilde de «kofte» encuentra la ficha de köfte.
- La ficha de adaptación muestra el aviso visible, enlace de procedencia, enlace al pin y video local.
- Se reprodujo el video nuevo de tofu con coco: duración reconocida, reproducción avanzando y sin error.
- Un favorito nuevo persistió al recargar; después se revirtió la selección usada en la prueba.
- Dos recetas nuevas en compras agruparon la sal en una sola entrada, conservando las cantidades por receta. Se retiraron después las dos selecciones de prueba.
- El ingrediente nuevo gochujang aparece en la despensa como «No tengo».
- El filtro Procedencia muestra 23 recetas del tablero; combinado con Desayuno muestra 1. Restablecer vuelve a las 73 del catálogo.
- En Qué puedo cocinar, permitir cualquier número de faltantes muestra las 23 del tablero; tolerancia cero y despensa vacía muestra cero.
- La vista comprobada no presenta desbordamiento horizontal, fotos rotas ni errores JavaScript.

El inventario editable está en `data/board-index.json`; las recetas en `data/pinterest-a.json`, `data/pinterest-b.json` y `data/pinterest-root.json`. La evidencia y el informe técnico de videos permanecen en `research/`.

Los estados «pending» de los primeros archivos de investigación son históricos, anteriores a la autorización de adaptaciones. El resultado final está en `research/pinterest-import-result.json` y en `data/board-index.json`: no quedan pines pendientes de esta importación.

Las recetas no se han probado cocinando. No se presentan las cantidades propuestas como medidas del autor original. Los demás perfiles de Pinterest compartidos inicialmente no forman parte de este tablero de 23 pines.
