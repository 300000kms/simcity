import { describe, it, expect } from 'vitest'
import { config } from '../src/engine/config.js'
import { crearMundo } from '../src/engine/world.js'
import { step, calcularNinos } from '../src/engine/systems/economia.js'
import { mallaSintetica } from './helpers.js'

const mundo = () => crearMundo({ celdas: mallaSintetica(), config })

describe('economía', () => {
  it('enlace 23: los niños en edad escolar son una fracción de la población', () => {
    const r = calcularNinos([{ poblacion: 1000 }], config)
    expect(r[0].ninosEscolares).toBeCloseTo(1000 * config.economia.fraccionNinos, 6)
  })

  it('sin cambios no hay migración', () => {
    const m = mundo()
    const { mundo: r } = step(m, config)
    r.celdas.forEach((c, i) => expect(c.poblacion).toBeCloseTo(m.celdas[i].poblacion, 6))
  })

  it('las familias van hacia donde mejora la escuela y huyen del suelo caro', () => {
    const m = mundo()
    const celdas = m.celdas.map((c, i) => {
      if (i === 0) return { ...c, calidadEscuela: c.calidadInicial + 0.2 }
      if (i === 1) return { ...c, valorSuelo: c.valorInicial * 1.3 }
      return c
    })
    const { mundo: r } = step({ ...m, celdas }, config)
    expect(r.celdas[0].poblacion).toBeGreaterThan(m.celdas[0].poblacion)
    expect(r.celdas[1].poblacion).toBeLessThan(m.celdas[1].poblacion)
    expect(r.celdas[0].ninosEscolares).toBeCloseTo(r.celdas[0].poblacion * config.economia.fraccionNinos, 6)
  })

  it('la capacidad residencial limita el crecimiento sin expulsar a nadie', () => {
    const m = mundo()
    const capacidad = (c) => c.area * c.densidad * config.economia.habitantesPorM2
    const celdas = m.celdas.map((c, i) => ({
      ...c,
      calidadEscuela: 1,
      calidadInicial: 0,
      poblacion: i === 0 ? capacidad(c) * 2 : capacidad(c) * 0.999
    }))
    const r = step({ ...m, celdas }, config).mundo.celdas
    expect(r[0].poblacion).toBeCloseTo(celdas[0].poblacion, 6)
    for (const c of r.slice(1)) expect(c.poblacion).toBeLessThanOrEqual(capacidad(c) + 1e-6)
  })
})
