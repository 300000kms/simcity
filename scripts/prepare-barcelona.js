// Prepara los GeoJSON de Barcelona a partir de los originales de CartoBCN
// (Ajuntament de Barcelona, CC-BY). Se ejecuta una sola vez:
//   npm run data:barcelona
// Entrada: src/data/barcelona/{barrios,distritos}_raw.geojson
// Salida:  src/data/barcelona/{limite,distritos,barrios}.geojson
import { readFileSync, writeFileSync } from 'node:fs'
import { union, featureCollection, bbox, truncate } from '@turf/turf'

const dir = new URL('../src/data/barcelona/', import.meta.url)
const leer = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'))
const escribir = (f, g) => writeFileSync(new URL(f, dir), JSON.stringify(g))
const recortar = (g) => truncate(g, { precision: 6, coordinates: 2 })

const distritosRaw = leer('distritos_raw.geojson')
const barriosRaw = leer('barrios_raw.geojson')

const distritos = featureCollection(
  distritosRaw.features.map((f) => ({
    type: 'Feature',
    id: Number(f.properties.DISTRICTE),
    properties: { id: Number(f.properties.DISTRICTE), nombre: f.properties.NOM },
    geometry: f.geometry
  }))
)

const barrios = featureCollection(
  barriosRaw.features.map((f) => ({
    type: 'Feature',
    id: Number(f.properties.BARRI),
    properties: {
      id: Number(f.properties.BARRI),
      nombre: f.properties.NOM,
      distrito: Number(f.properties.DISTRICTE)
    },
    geometry: f.geometry
  }))
)

// Límite municipal: unión de los 10 distritos
const limiteGeom = union(distritos)
const limite = featureCollection([
  { type: 'Feature', properties: { nombre: 'Barcelona', ine: '080193' }, geometry: limiteGeom.geometry }
])

escribir('distritos.geojson', recortar(distritos))
escribir('barrios.geojson', recortar(barrios))
escribir('limite.geojson', recortar(limite))

console.log('distritos', distritos.features.length, 'barrios', barrios.features.length)
console.log('limite', limiteGeom.geometry.type, 'bbox', bbox(limite).map((v) => v.toFixed(4)).join(', '))
