// Actualización del mapa tras cada tick: feature-state por celda, sin setData sobre la malla.
import { CAPAS } from './layers.js'

/**
 * Escribe en cada celda el valor normalizado de la capa activa.
 * @param {import('maplibre-gl').Map} map
 * @param {object} mundo
 * @param {string} capa clave de CAPAS
 */
export function actualizarCeldas(map, mundo, capa) {
  const { valor, dominio } = CAPAS[capa]
  const [a, b] = dominio
  for (const c of mundo.celdas) {
    const v = Math.min(1, Math.max(0, (valor(c) - a) / (b - a)))
    map.setFeatureState({ source: 'malla', id: c.id }, { v })
  }
}

/**
 * Puntos de escuelas existentes y pendientes. Es una fuente pequeña aparte,
 * así que aquí sí se usa setData.
 * @param {import('maplibre-gl').Map} map
 * @param {object} mundo
 * @param {number[]} pendientes ids de celda
 * @param {Array<[number, number]>} centros centro [lng, lat] de cada celda
 */
export function actualizarEscuelas(map, mundo, pendientes, centros) {
  const punto = (id, pendiente) => ({
    type: 'Feature',
    properties: { celda: id, pendiente },
    geometry: { type: 'Point', coordinates: centros[id] }
  })
  const features = []
  for (const c of mundo.celdas) if (c.escuelas > 0) features.push(punto(c.id, false))
  for (const id of pendientes) features.push(punto(id, true))
  map.getSource('escuelas').setData({ type: 'FeatureCollection', features })
}
