import { describe, it, expect } from 'vitest'
import { crearRng } from '../src/engine/rng.js'

describe('rng', () => {
  it('misma semilla, misma secuencia', () => {
    const a = crearRng(42)
    const b = crearRng(42)
    for (let i = 0; i < 100; i++) expect(a.siguiente()).toBe(b.siguiente())
  })

  it('semillas distintas dan secuencias distintas', () => {
    expect(crearRng(1).siguiente()).not.toBe(crearRng(2).siguiente())
  })

  it('se reanuda desde un estado guardado', () => {
    const a = crearRng(7)
    a.siguiente()
    const b = crearRng(a.estado())
    expect(b.siguiente()).toBe(a.siguiente())
  })

  it('genera valores en rango', () => {
    const r = crearRng(3)
    for (let i = 0; i < 1000; i++) {
      const x = r.siguiente()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
      const k = r.entero(2, 5)
      expect(k).toBeGreaterThanOrEqual(2)
      expect(k).toBeLessThanOrEqual(5)
    }
  })
})
