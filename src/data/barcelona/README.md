# Datos de Barcelona

Fuente: Ajuntament de Barcelona, CartoBCN, unidades administrativas (licencia CC-BY).
Descargados del espejo https://github.com/martgnz/bcn-geodata (conversión directa de los
shapefiles oficiales, actualización de origen 11/03/2020), porque el entorno de desarrollo
no tiene acceso a opendata-ajuntament.barcelona.cat.

- `distritos_raw.geojson`, `barrios_raw.geojson`: originales, todas las propiedades.
- `distritos.geojson`: 10 distritos, `properties: { id, nombre }`.
- `barrios.geojson`: 73 barrios, `properties: { id, nombre, distrito }`.
- `limite.geojson`: término municipal, unión de los 10 distritos (≈ 101.6 km²).

Se regeneran con `npm run data:barcelona`.
