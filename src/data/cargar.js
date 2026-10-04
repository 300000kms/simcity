// Carga los GeoJSON de Barcelona empaquetados con la app y genera la malla.
import { centroid } from '@turf/turf'
import { config } from '../engine/config.js'
import { generarMalla, descriptoresCeldas } from '../map/grid.js'
import limiteTxt from './barcelona/limite.geojson?raw'
import distritosTxt from './barcelona/distritos.geojson?raw'
import barriosTxt from './barcelona/barrios.geojson?raw'

/**
 * @returns {{ malla: object, distritos: object, barrios: object, centros: Array<[number, number]>,
 *   celdas: Array<object>, nombresBarrios: Object<number, string> }}
 */
export function cargarBarcelona() {
  const limite = JSON.parse(limiteTxt)
  const distritos = JSON.parse(distritosTxt)
  const barrios = JSON.parse(barriosTxt)
  const malla = generarMalla({ limite, barrios, ...config.malla })
  return {
    malla,
    distritos,
    barrios,
    centros: malla.features.map((f) => centroid(f).geometry.coordinates),
    celdas: descriptoresCeldas(malla),
    nombresBarrios: Object.fromEntries(barrios.features.map((f) => [f.properties.id, f.properties.nombre]))
  }
}
