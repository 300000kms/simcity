import { readFileSync } from 'node:fs'
import { config } from '../src/engine/config.js'
import { generarMalla, descriptoresCeldas } from '../src/map/grid.js'

/** Malla cuadrada sintética: n x n celdas repartidas entre los 10 distritos por columnas. */
export function mallaSintetica(n = 20) {
  const celdas = []
  for (let fila = 0; fila < n; fila++) {
    for (let col = 0; col < n; col++) {
      const distrito = 1 + Math.floor((col * 10) / n)
      celdas.push({ id: celdas.length, fila, col, barrio: distrito, distrito, area: 62500 })
    }
  }
  return celdas
}

let cache = null
/** Malla real de Barcelona (se genera una vez por proceso). */
export function mallaBarcelona() {
  if (cache) return cache
  const leer = (f) => JSON.parse(readFileSync(new URL(`../src/data/barcelona/${f}`, import.meta.url), 'utf8'))
  cache = generarMalla({ limite: leer('limite.geojson'), barrios: leer('barrios.geojson'), ...config.malla })
  return cache
}

export function celdasBarcelona() {
  return descriptoresCeldas(mallaBarcelona())
}
