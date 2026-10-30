# Verde a mano · Recetas veganas

Recetario personal que funciona en tu computadora, con despensa, filtros de ingredientes faltantes, utensilios, favoritos y lista de compras. No necesita suscripción, API de IA, base de datos ni servicios de alojamiento.

Incluye **73 recetas**, **73 fotos** y **46 videos locales**, con sus enlaces de procedencia. Los medios ocupan aproximadamente **604 MB** y se descargan junto al proyecto, sin Git LFS. Después de descargarlo puedes usar el recetario sin conexión; abrir enlaces externos sí requiere internet.

## Si vas a pedirle ayuda a una IA

Copia y envíale este mensaje:

> Quiero descargar y usar localmente Verde a mano desde https://github.com/nicolgg-sudo/recetas-veganas. Lee primero README.md, SETUP_IA.md y AGENTS.md del repositorio. Descarga el proyecto completo en una carpeta nueva, verifica los archivos y ayúdame a abrirlo en mi computadora. Quiero mi propia despensa y favoritos; no importes datos de otra persona ni publiques una web. Si el repositorio privado no me deja entrar, explícame cómo aceptar el acceso con mi propia cuenta de GitHub; no me pidas las credenciales de la propietaria.

La guía técnica está en **[SETUP_IA.md](SETUP_IA.md)**. Las instrucciones de uso están en **[LEEME.md](LEEME.md)**.

## Descargar

Este repositorio es privado. La propietaria debe darte acceso y debes aceptar la invitación con **tu cuenta de GitHub** antes de poder descargarlo. No es necesario compartir contraseñas ni tokens.

Puedes usar una de estas opciones:

1. En GitHub, abre **Code → Download ZIP**, espera la descarga completa y **extrae todo el ZIP**. No abras solo un archivo dentro del comprimido.
2. Si tienes Git instalado:

   ```sh
   git clone https://github.com/nicolgg-sudo/recetas-veganas.git
   cd recetas-veganas
   ```

No descargues únicamente `index.html`: también necesitas `app.js`, `styles.css`, `data/`, `assets/` y los scripts de inicio. GitHub documenta el [procedimiento de clonación y los requisitos de acceso](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).

## Abrir en tu computadora

Necesitas un navegador actualizado y **Python 3.10 o posterior**. Si no tienes Python, obténlo desde [python.org](https://www.python.org/downloads/). En Windows, habilita la opción de agregar Python al PATH durante la instalación.

### Windows

Haz doble clic en **Abrir recetario.cmd**. Si tu instalación solo reconoce `py`, puedes usar desde la carpeta del proyecto:

```powershell
py -3 scripts/check-installation.py
py -3 scripts/launch.py
```

### macOS o Linux

Desde la carpeta del proyecto:

```sh
python3 scripts/check-installation.py
python3 scripts/launch.py
```

La aplicación abre en **http://127.0.0.1:8766**. Si el navegador no se abre solo, escribe esa dirección. Para detenerla usa **Cerrar recetario.cmd** en Windows o ejecuta el mismo comando de Python con `scripts/launch.py --stop`.

No necesitas instalar Node, npm, librerías de Python, FFmpeg, extensiones ni iniciar sesión en Pinterest para usar el catálogo incluido.

## Tu copia es independiente

- La despensa, los utensilios, favoritos, compras y pasos completados se guardan en **tu navegador**, no en GitHub ni en la computadora de la propietaria.
- Marca tus propios ingredientes y revisa **Mis utensilios**: la selección inicial de equipos viene del proyecto y puede no coincidir con tu cocina.
- No hay sincronización entre personas ni dispositivos. Una copia de seguridad se importa solo si tú decides hacerlo.
- Usa **Copia de seguridad** para exportar tus selecciones antes de borrar datos del navegador o cambiar de perfil. No subas esas copias a GitHub.
- Si dos personas usan la misma computadora, utilicen perfiles de navegador diferentes para mantener sus selecciones separadas.

## Recetas y procedencia

Las primeras 50 recetas proceden de Loving It Vegan. La sección **Mi tablero** reúne los 23 pines del tablero de referencia de la propietaria. De esos 23, 8 conservan medidas publicadas y 15 son **adaptaciones con medidas propuestas, sin probar**, autorizadas por ella e identificadas en cada ficha. El video de referencia puede diferir de las cantidades de una adaptación.

Las fotos y videos mantienen su autoría original. Su inclusión no les atribuye una licencia de software ni transfiere derechos sobre ellos. La procedencia disponible permanece enlazada en las fichas. Consulta [AVISOS_CONTENIDO.md](AVISOS_CONTENIDO.md).

## Actualizar o mantener

Si clonaste con Git y no tienes cambios locales pendientes, `git pull --ff-only` descarga las actualizaciones. Si has modificado recetas, conserva tus cambios antes de actualizar; no uses un restablecimiento forzado.

El catálogo ya viene compilado. Solo después de editar los JSON de recetas ejecuta:

```sh
python scripts/build-catalog.py
python scripts/check-installation.py
```

En macOS/Linux sustituye `python` por `python3`; en Windows también puedes usar `py -3`. No se incluyen los archivos temporales de investigación ni los scripts experimentales de importación, porque no son necesarios para usar o mantener el recetario.
