import { describe, it, expect } from 'vitest'
import { config } from '../src/engine/config.js'
import { mallaBarcelona } from './helpers.js'

describe('malla de Barcelona', () => {
  const malla = mallaBarcelona()

  it('tiene entre 1500 y 2500 celdas', () => {
    expect(malla.features.length).toBeGreaterThanOrEqual(1500)
    expect(malla.features.length).toBeLessThanOrEqual(2500)
  })

  it('cubre los 10 distritos y los 73 barrios', () => {
    expect(new Set(malla.features.map((f) => f.properties.distrito)).size).toBe(10)
    expect(new Set(malla.features.map((f) => f.properties.barrio)).size).toBe(73)
  })

  it('todas las celdas caen dentro del bbox municipal', () => {
    const [x0, y0, x1, y1] = config.mapa.bbox
    const eps = 1e-6
    for (const f of malla.features) {
      const poligonos = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
      for (const [x, y] of poligonos.flat(2)) {
        expect(x).toBeGreaterThanOrEqual(x0 - eps)
        expect(x).toBeLessThanOrEqual(x1 + eps)
        expect(y).toBeGreaterThanOrEqual(y0 - eps)
        expect(y).toBeLessThanOrEqual(y1 + eps)
      }
    }
  })

  it('ids consecutivos y posiciones de malla únicas', () => {
    malla.features.forEach((f, i) => expect(f.properties.id).toBe(i))
    const pos = new Set(malla.features.map((f) => f.properties.fila + ',' + f.properties.col))
    expect(pos.size).toBe(malla.features.length)
  })
})
