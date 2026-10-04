import { describe, it, expect } from 'vitest'
import { config } from '../src/engine/config.js'
import { crearMundo } from '../src/engine/world.js'
import { step, fijarPartida, ejecutarInversiones } from '../src/engine/systems/presupuesto.js'
import { calcularBaseFiscal } from '../src/engine/systems/economia.js'
import { mallaSintetica } from './helpers.js'

const mundo = () => crearMundo({ celdas: mallaSintetica(), config })

describe('presupuesto', () => {
  it('enlace 38: los impuestos son proporcionales a la base fiscal', () => {
    const m = mundo()
    const { mundo: r } = step(m, config)
    const esperado = (calcularBaseFiscal(m.celdas) * config.presupuesto.tipoImpositivoAnual) / 4
    expect(r.presupuesto.ingresosImpuestos).toBeCloseTo(esperado, 6)
    expect(r.presupuesto.ingresos).toBeCloseTo(esperado + config.presupuesto.transferenciasAnuales / 4, 6)
  })

  it('más valor del suelo da más ingresos', () => {
    const m = mundo()
    const rico = { ...m, celdas: m.celdas.map((c) => ({ ...c, valorSuelo: c.valorSuelo * 1.2 })) }
    expect(step(rico, config).mundo.presupuesto.ingresos).toBeGreaterThan(step(m, config).mundo.presupuesto.ingresos)
  })

  it('el déficit se financia con deuda (bonos)', () => {
    const m = fijarPartida(mundo(), 'gastoCorriente', 6000, config)
    const { mundo: r, eventos } = step(m, config)
    expect(r.presupuesto.saldo).toBeLessThan(0)
    expect(r.presupuesto.deuda).toBeCloseTo(m.presupuesto.deuda - r.presupuesto.saldo, 6)
    expect(eventos.some((e) => e.tipo === 'deficit')).toBe(true)
  })

  it('el superávit amortiza deuda y el exceso va al remanente', () => {
    let m = fijarPartida(mundo(), 'gastoCorriente', 0, config)
    m = { ...m, presupuesto: { ...m.presupuesto, deuda: 10 } }
    const { mundo: r } = step(m, config)
    expect(r.presupuesto.deuda).toBe(0)
    expect(r.presupuesto.remanente).toBeCloseTo(r.presupuesto.saldo - 10, 6)
  })

  it('avisa de quiebra al superar el umbral', () => {
    const m = mundo()
    const endeudado = { ...m, presupuesto: { ...m.presupuesto, deuda: config.presupuesto.umbralQuiebra + 1 } }
    expect(step(endeudado, config).eventos.some((e) => e.tipo === 'quiebra')).toBe(true)
  })

  it('no modifica el mundo recibido', () => {
    const m = mundo()
    const copia = JSON.stringify(m)
    step(m, config)
    expect(JSON.stringify(m)).toBe(copia)
  })

  it('fijarPartida limita el rango y rechaza partidas desconocidas', () => {
    const m = mundo()
    expect(fijarPartida(m, 'inversionCapital', -5, config).presupuesto.inversionCapital).toBe(0)
    expect(() => fijarPartida(m, 'sobornos', 1, config)).toThrow()
  })

  it('las escuelas nuevas se pagan con el fondo de inversión', () => {
    const m = mundo()
    const coste = config.escuelas.costeConstruccion
    const conFondo = { ...m, presupuesto: { ...m.presupuesto, fondoInversion: coste * 1.5 } }
    const { mundo: r, eventos } = ejecutarInversiones(conFondo, config, [0, 1])
    expect(r.celdas[0].escuelas).toBe(m.celdas[0].escuelas + 1)
    expect(r.celdas[1].escuelas).toBe(m.celdas[1].escuelas)
    expect(r.presupuesto.fondoInversion).toBeCloseTo(coste * 0.5, 6)
    expect(eventos.map((e) => e.tipo)).toEqual(['escuelaNueva', 'escuelaRechazada'])
  })
})
