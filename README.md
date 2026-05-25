# Buscador de zonas de Castelldefels

Web app sencilla en HTML, CSS y JavaScript para buscar zonas desde un CSV con estas columnas exactas:

```csv
barrio_codigo,barrio,zona_codigo,zona
```

## Archivos

- `index.html`: estructura de la pantalla.
- `styles.css`: estilos responsive.
- `script.js`: carga del CSV, busqueda, ordenacion y copia de codigos.
- `zonas.csv`: datos exportados desde el archivo recibido.
- `robots.txt`: pide a los buscadores que no indexen la web.

## Como usarla

Abre la carpeta con un servidor local y visita la URL que indique. Por ejemplo:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000
```

## Actualizar datos

Sustituye `zonas.csv` por otro CSV con las mismas columnas. La app no depende de un numero fijo de filas y maneja filas incompletas dejando vacios los campos que falten.

La busqueda empieza a partir de 2 letras, ignora mayusculas/minusculas y acentos, prioriza coincidencias por `zona` y tambien busca por `barrio`.

## Indexacion

La pagina incluye metaetiquetas `noindex` y un `robots.txt` para pedir a Google y otros buscadores que no la indexen. Esto no hace que la web sea privada: cualquiera con el enlace podra verla si la publicas.
