// Malla de celdas de Barcelona.
// Solo usa Turf (sin MapLibre), así que funciona igual en el navegador y en Node.
import {
  squareGrid,
  bbox as turfBbox,
  booleanPointInPolygon,
  bboxClip,
  featureCollection,
  centroid,
  area,
  point
} from '@turf/turf'

/**
 * Genera la malla cuadrada recortada con el límite municipal y asigna a cada
 * celda su barrio y su distrito.
 * @param {object} opciones
 * @param {object} opciones.limite FeatureCollection con el contorno municipal
 * @param {object} opciones.barrios FeatureCollection de barrios (properties.id, properties.distrito)
 * @param {number} opciones.tamanoCelda lado de la celda en km
 * @param {number} [opciones.areaMinima] fracción mínima de celda que se conserva tras recortar
 * @returns {object} FeatureCollection de celdas con properties { id, fila, col, barrio, distrito, area }
 */
export function generarMalla({ limite, barrios, tamanoCelda, areaMinima = 0.15 }) {
  const contorno = limite.features[0]
  const caja = turfBbox(contorno)
  const bruta = squareGrid(caja, tamanoCelda, { units: 'kilometers' })
  const areaCompleta = tamanoCelda * tamanoCelda * 1e6
  const indiceBarrios = barrios.features.map((f) => ({ f, caja: turfBbox(f) }))

  // Filas y columnas a partir de la esquina inferior izquierda de cada celda
  const x0 = Math.min(...bruta.features.map((c) => c.geometry.coordinates[0][0][0]))
  const y0 = Math.min(...bruta.features.map((c) => c.geometry.coordinates[0][0][1]))
  const paso = celdaPaso(bruta.features[0])

  const celdas = []
  for (const celda of bruta.features) {
    const anillo = celda.geometry.coordinates[0]
    const dentro = anillo.slice(0, 4).filter((p) => booleanPointInPolygon(p, contorno)).length
    let geom = celda.geometry
    if (dentro < 4) {
      // Celda en el borde (o fuera): recortar el límite con el rectángulo de la celda
      const corte = bboxClip(contorno, turfBbox(celda)).geometry
      if (!tieneSuperficie(corte)) continue
      geom = corte
    }
    const superficie = area(geom)
    if (superficie < areaMinima * areaCompleta) continue

    const c = centroid(geom).geometry.coordinates
    const barrio = buscarBarrio(c, indiceBarrios)
    if (!barrio) continue

    const [minX, minY] = turfBbox(celda)
    celdas.push({
      type: 'Feature',
      id: celdas.length,
      properties: {
        id: celdas.length,
        col: Math.round((minX - x0) / paso[0]),
        fila: Math.round((minY - y0) / paso[1]),
        barrio: barrio.properties.id,
        distrito: barrio.properties.distrito,
        area: Math.round(superficie)
      },
      geometry: geom
    })
  }
  return featureCollection(celdas)
}

/**
 * Convierte la malla GeoJSON en la lista mínima de descriptores que necesita el motor.
 * @param {object} malla FeatureCollection devuelta por generarMalla
 * @returns {Array<{id:number, fila:number, col:number, barrio:number, distrito:number, area:number}>}
 */
export function descriptoresCeldas(malla) {
  return malla.features.map((f) => ({ ...f.properties }))
}

function tieneSuperficie(geom) {
  if (geom.type === 'Polygon') return geom.coordinates.length > 0 && geom.coordinates[0].length >= 4
  geom.coordinates = geom.coordinates.filter((p) => p.length > 0 && p[0].length >= 4)
  return geom.coordinates.length > 0
}

function celdaPaso(celda) {
  const [minX, minY, maxX, maxY] = turfBbox(celda)
  return [maxX - minX, maxY - minY]
}

function buscarBarrio(coord, indice) {
  const [x, y] = coord
  for (const { f, caja } of indice) {
    if (x < caja[0] || x > caja[2] || y < caja[1] || y > caja[3]) continue
    if (booleanPointInPolygon(point(coord), f)) return f
  }
  // Centroide fuera de todo barrio (borde de costa): el barrio más cercano por caja
  let mejor = null
  let dMin = Infinity
  for (const { f, caja } of indice) {
    const d = Math.hypot(x - (caja[0] + caja[2]) / 2, y - (caja[1] + caja[3]) / 2)
    if (d < dMin) { dMin = d; mejor = f }
  }
  return mejor
}
