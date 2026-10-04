import { describe, it, expect } from 'vitest'
import { config } from '../src/engine/config.js'
import { crearMundo } from '../src/engine/world.js'
import { step, calcularAccesoEscuelas } from '../src/engine/systems/territorio.js'
import { mallaSintetica } from './helpers.js'

const mundo = () => crearMundo({ celdas: mallaSintetica(), config })

function conEscuelaEn(m, id) {
  return { ...m, celdas: m.celdas.map((c) => (c.id === id ? { ...c, escuelas: c.escuelas + 1 } : c)) }
}

describe('territorio', () => {
  it('el mundo inicial está en equilibrio: sin cambios, el suelo no se mueve', () => {
    const m = mundo()
    const { mundo: r } = step(m, config)
    r.celdas.forEach((c, i) => expect(c.valorSuelo).toBeCloseTo(m.celdas[i].valorSuelo, 6))
  })

  it('el acceso a la escuela decae con la distancia', () => {
    const celdas = mallaSintetica(10).map((c) => ({ ...c, escuelas: c.fila === 5 && c.col === 5 ? 1 : 0 }))
    const r = calcularAccesoEscuelas(celdas, config)
    const en = (f, c) => r.find((x) => x.fila === f && x.col === c).accesoEscuela
    expect(en(5, 5)).toBe(1)
    expect(en(5, 6)).toBeGreaterThan(en(5, 7))
    expect(en(5, 5 + config.escuelas.radioInfluencia + 1)).toBe(0)
  })

  it('enlace 24: una escuela nueva sube el valor del suelo de su entorno', () => {
    const m = mundo()
    const id = m.celdas.filter((c) => c.escuelas === 0).sort((a, b) => a.accesoEscuela - b.accesoEscuela)[0].id
    let r = conEscuelaEn(m, id)
    for (let k = 0; k < 8; k++) r = step(r, config).mundo
    expect(r.celdas[id].valorSuelo).toBeGreaterThan(m.celdas[id].valorSuelo)
    expect(r.celdas[id].calidadEscuela).toBeGreaterThan(m.celdas[id].calidadEscuela)
  })

  it('más financiación escolar sube la calidad y el valor del suelo', () => {
    const m = mundo()
    const rico = { ...m, presupuesto: { ...m.presupuesto, financiacionEscuelas: m.presupuesto.financiacionEscuelas * 2 } }
    const a = step(m, config).mundo
    const b = step(rico, config).mundo
    const media = (w, k) => w.celdas.reduce((s, c) => s + c[k], 0) / w.celdas.length
    expect(media(b, 'calidadEscuela')).toBeGreaterThan(media(a, 'calidadEscuela'))
    expect(media(b, 'valorSuelo')).toBeGreaterThan(media(a, 'valorSuelo'))
  })

  it('la calidad escolar está entre 0 y 1', () => {
    const m = mundo()
    const rico = { ...m, presupuesto: { ...m.presupuesto, financiacionEscuelas: 1e6 } }
    for (const c of step(rico, config).mundo.celdas) {
      expect(c.calidadEscuela).toBeGreaterThanOrEqual(0)
      expect(c.calidadEscuela).toBeLessThanOrEqual(1)
    }
  })
})
