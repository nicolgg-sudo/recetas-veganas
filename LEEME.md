# Verde a mano

Tu recetario vegano personal para la laptop. No necesita instalación, cuenta, suscripción ni conexión para consultar las recetas y los medios descargados.

## Abrir

Haz doble clic en **Abrir recetario.cmd** dentro de esta carpeta. Inicia la aplicación en tu laptop y la abre en tu navegador habitual, en `http://127.0.0.1:8766`. Se usa el Python que ya está instalado en tu laptop; no necesita descargar paquetes. Si ya estaba abierta, vuelve a mostrarla sin iniciar otra copia. **Cerrar recetario.cmd** detiene el servidor local cuando quieras.

También puedes abrir **index.html** directamente. Esta alternativa está preparada para funcionar sin servidor; la vista integrada de verificación permite probar HTTP local, pero bloquea las direcciones de archivo, por lo que la comprobación funcional se realizó por HTTP. El inicio recomendado usa ese mismo modo verificado.

Conserva la carpeta completa: `index.html`, `app.js`, `styles.css`, `scripts/`, `data/` y `assets/`. Las fotos y los videos dependen de esa estructura. El servidor solo escucha en tu propia laptop y no publica la aplicación en internet.

Usa siempre el mismo navegador y el mismo modo de inicio para conservar tus selecciones. Evita el modo incógnito. Abrirlo por archivo y abrirlo mediante un servidor local son dos espacios de guardado diferentes: puedes transferir tus selecciones con una copia de seguridad.

## Primeros pasos

1. En **Mi despensa**, marca lo que tienes. La lista contiene los ingredientes de las 73 recetas, incluidos especias y aceites. Los ingredientes nuevos no se marcan automáticamente como disponibles.
2. En **Mis utensilios**, revisa los equipos que ya me dijiste que tienes y los accesorios adicionales.
3. En **Qué puedo cocinar**, elige el máximo de ingredientes que pueden faltarte. Los opcionales no excluyen una receta. No se calculan cantidades disponibles ni se descuentan ingredientes al cocinar.
4. En **Recetario**, explora las 73 recetas aunque no tengas sus ingredientes. Hay 11 desayunos, 16 almuerzos, 17 cenas, 18 snacks y 11 postres. Filtra por categoría, procedencia, disponibilidad, tiempo activo y congelación. En la despensa usa ☆ para marcar ingredientes difíciles de conseguir y ★ para desmarcarlos. El filtro **Sin mis difíciles** usa tus propias etiquetas; las iniciales son sugerencias editables.
5. Usa **+ Lista** para reunir los ingredientes de varias recetas en **Lista de compras**. Los nombres se agrupan sin duplicados; las cantidades se muestran por receta para no sumar incorrectamente latas, gramos y tazas. Marcar un ingrediente actualiza la despensa.
6. Dentro de una receta, **Empezar a cocinar** muestra un paso a la vez. Puedes marcar pasos completados, guardar favoritos e imprimir.
7. En **Mi tablero**, encuentra los 23 pines de tu tablero personal «vegan». Puedes mostrar todos, solo los que tienen medidas publicadas o solo las adaptaciones. También puedes elegir **Mi tablero de Pinterest** en el filtro Procedencia del recetario o de Qué puedo cocinar.

Las cantidades corresponden al rendimiento original indicado en cada ficha: unidades, vasos o raciones. Esta versión no ajusta automáticamente las cantidades ni el texto de los pasos al cambiar el rendimiento. La mayoría de las preparaciones rinden varias raciones; la avena individual explica cómo repetir frascos.

## Guardado y copias

Las selecciones se guardan automáticamente en este navegador. Usa **Copia de seguridad** para exportarlas antes de borrar datos del navegador, mover el archivo o cambiar de equipo. En pantallas estrechas el botón **Copia** aparece arriba.

La copia JSON incluye despensa, etiquetas de ingredientes difíciles, utensilios, favoritos, compras y pasos completados. Las recetas y los medios permanecen en la carpeta: copia también esta carpeta para conservar la aplicación completa. Al restaurar una copia válida se descarga una copia de tus selecciones anteriores para poder recuperarlas.

## Fuentes y medios

El catálogo inicial utiliza 50 recetas veganas de **Loving It Vegan**, de **Alison Andrews**. Se añadieron los 23 pines del tablero personal **nikipjitap/vegan**. Hay 73 fotos y 46 videos locales en total. Las 27 fichas sin video lo indican y tienen foto local. Los videos pueden conservar rótulos o audio del idioma original.

De las 23 fichas del tablero, **8 conservan las medidas publicadas** en la receta o descripción de su fuente. **15 son adaptaciones con medidas propuestas**, autorizadas por la usuaria al faltar cantidades o pasos completos. Estas se identifican en las tarjetas y en la cabecera de la ficha como **Medidas propuestas · Sin probar**. Su nota explica qué se añadió y que el video es una referencia, no una demostración exacta de las proporciones propuestas. No se afirma haberlas probado cocinando.

Cada ficha conserva el enlace de procedencia disponible y el enlace al pin específico de tu tablero. Cuando solo se pudo identificar una publicación compartida, se indica sin atribuir falsamente la autoría original. Las fotos y los videos corresponden a los pines originales; en las adaptaciones veganas pueden verse ingredientes o resultados diferentes a los de la ficha.

El bizcocho de chocolate se presenta sin cobertura y lo aclara junto a la foto original. La preparación previa del arroz del salteado incluye un enlace adicional al método del fabricante Mahatma. Las adaptaciones no se presentan como recetas probadas personalmente.

El inventario importado está en `data/board-index.json`: registra los 23 pines únicos verificados en Chrome el 30 de octubre de 2026 y la receta asociada a cada uno. Los otros dos enlaces que compartiste son perfiles de referencia; esta importación corresponde a tu tablero personal, no a todos los pines de esos perfiles.

## Agregar recetas o ingredientes desde el chat

Dime qué ingredientes tienes aunque no aparezcan o pásame la receta/enlace que quieras agregar. Yo actualizaré el catálogo. No necesitas editar los archivos.

La disponibilidad en RD es una orientación, no una consulta del inventario de supermercados. Las presentaciones comerciales relevantes se conservan: garbanzo seco y de lata, por ejemplo. Cocer, cortar o exprimir son tareas de preparación; no equivalen a un alimento distinto en la despensa.

## Alcance de esta versión

Uso personal en esta laptop. Sin chatbot integrado, sincronización, publicación por internet ni control de cantidades/caducidades. Fotos, videos, estilos e instrucciones se cargan desde la carpeta local; abrir los enlaces del autor sí requiere internet.

## Mantenimiento

Las recetas editables están en `data/breakfast-snacks.json`, `data/lunch-dinner.json`, `data/desserts.json` y `data/pinterest-*.json`. Después de modificarlas, ejecutar `python scripts/build-catalog.py` genera `data/catalog.js`. `data/board-index.json` mantiene la relación con el tablero. Los ingredientes incorporados desde el chat se registran en `data/extra-pantry.json`. La aplicación ya incluye el catálogo compilado y no requiere Python para abrir el HTML directamente.

Para revisar por HTTP desde terminal: `python scripts/launch.py --no-browser` y abrir `http://127.0.0.1:8766`. Detener con `python scripts/launch.py --stop`. El servidor incluye soporte para avanzar y retroceder en los videos y solo sirve los archivos de la aplicación.
