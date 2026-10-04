// Capas del mapa y sus estilos. Las celdas se colorean con un único valor
// normalizado 'v' (0..1) que featureState.js escribe en el feature-state.

// Rampa secuencial de un solo tono (azul, claro a oscuro) para magnitudes
const AZUL = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b']
// Divergente rojo / gris / azul para cambios respecto al inicio (bajada / subida)
const DIVERGENTE = ['#9e2b2b', '#e34948', '#f0a3a0', '#f0efec', '#9ec5f4', '#3987e5', '#184f95']

export const COLOR_ESCUELA = '#eb6834'
export const COLOR_TINTA = '#0b0b0b'

const fmtEuros = (v) => `${Math.round(v).toLocaleString('es-ES')} €/m²`
const fmtPct = (v) => `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)} %`
const fmtIndice = (v) => v.toFixed(2)
const fmtHab = (v) => `${Math.round(v)} hab/ha`

/** Capas temáticas conmutables de la malla. */
export const CAPAS = {
  valorSuelo: {
    nombre: 'Valor del suelo',
    rampa: AZUL,
    dominio: [2000, 7500],
    valor: (c) => c.valorSuelo,
    formato: fmtEuros
  },
  cambioSuelo: {
    nombre: 'Cambio del valor del suelo',
    rampa: DIVERGENTE,
    dominio: [-0.1, 0.1],
    valor: (c) => c.valorSuelo / c.valorInicial - 1,
    formato: fmtPct
  },
  poblacion: {
    nombre: 'Densidad de población',
    rampa: AZUL,
    dominio: [0, 500],
    valor: (c) => c.poblacion / (c.area / 1e4),
    formato: fmtHab
  },
  calidadEscuela: {
    nombre: 'Calidad escolar',
    rampa: AZUL,
    dominio: [0.4, 1],
    valor: (c) => c.calidadEscuela,
    formato: fmtIndice
  },
  accesoEscuela: {
    nombre: 'Proximidad a una escuela',
    rampa: AZUL,
    dominio: [0, 1],
    valor: (c) => c.accesoEscuela,
    formato: fmtIndice
  }
}

/** Expresión de color para la capa activa. */
export function colorCapa(clave) {
  const { rampa } = CAPAS[clave]
  const paradas = rampa.flatMap((color, i) => [i / (rampa.length - 1), color])
  return ['interpolate', ['linear'], ['coalesce', ['feature-state', 'v'], 0], ...paradas]
}

/**
 * Estilo base: teselas raster de CARTO sin etiquetas debajo de la malla y solo
 * etiquetas encima. Gratuitas y sin clave. Si no cargan, el mapa sigue funcionando.
 */
export function estiloBase() {
  const carto = (tipo) => ['a', 'b', 'c', 'd'].map((s) => `https://${s}.basemaps.cartocdn.com/${tipo}/{z}/{x}/{y}@2x.png`)
  const atribucion = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a> · Límites: Ajuntament de Barcelona (CC-BY)'
  return {
    version: 8,
    sources: {
      fondo: { type: 'raster', tiles: carto('light_nolabels'), tileSize: 256, attribution: atribucion },
      etiquetas: { type: 'raster', tiles: carto('light_only_labels'), tileSize: 256 }
    },
    layers: [
      { id: 'fondo-color', type: 'background', paint: { 'background-color': '#f4f3ef' } },
      { id: 'fondo', type: 'raster', source: 'fondo' }
    ]
  }
}

/**
 * Añade fuentes y capas de la simulación.
 * @param {import('maplibre-gl').Map} map
 * @param {object} datos { malla, distritos, barrios }
 * @param {string} capa clave de CAPAS
 */
export function anadirCapas(map, { malla, distritos, barrios }, capa) {
  map.addSource('malla', { type: 'geojson', data: malla })
  map.addSource('distritos', { type: 'geojson', data: distritos })
  map.addSource('barrios', { type: 'geojson', data: barrios })
  map.addSource('escuelas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

  map.addLayer({
    id: 'celdas',
    type: 'fill',
    source: 'malla',
    paint: { 'fill-color': colorCapa(capa), 'fill-opacity': 0.78 }
  })
  map.addLayer({
    id: 'celdas-hover',
    type: 'line',
    source: 'malla',
    paint: {
      'line-color': COLOR_TINTA,
      'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 2.5, 1.2],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'sel'], false], 1,
        ['boolean', ['feature-state', 'hover'], false], 0.6,
        0
      ]
    }
  })
  map.addLayer({
    id: 'barrios-linea',
    type: 'line',
    source: 'barrios',
    paint: { 'line-color': '#52514e', 'line-width': 0.6, 'line-opacity': 0.5 }
  })
  map.addLayer({
    id: 'distritos-linea',
    type: 'line',
    source: 'distritos',
    paint: { 'line-color': '#0b0b0b', 'line-width': 1.6, 'line-opacity': 0.7 }
  })
  map.addLayer({ id: 'etiquetas', type: 'raster', source: 'etiquetas', paint: { 'raster-opacity': 0.85 } })
  map.addLayer({
    id: 'escuelas',
    type: 'circle',
    source: 'escuelas',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 15, 7],
      'circle-color': ['case', ['get', 'pendiente'], '#ffffff', COLOR_ESCUELA],
      'circle-stroke-color': ['case', ['get', 'pendiente'], COLOR_ESCUELA, '#ffffff'],
      'circle-stroke-width': 2
    }
  })
}
