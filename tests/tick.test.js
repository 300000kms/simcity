import { describe, it, expect } from 'vitest'
import { config } from '../src/engine/config.js'
import { crearMundo } from '../src/engine/world.js'
import { tick } from '../src/engine/tick.js'
import { fijarPartida } from '../src/engine/systems/presupuesto.js'
import { celdasBarcelona } from './helpers.js'

function partida(semilla, ticks = 40) {
  let m = crearMundo({ celdas: celdasBarcelona(), config, semilla })
  m = fijarPartida(m, 'financiacionEscuelas', 380, config)
  const historial = [m.indicadores]
  const eventos = []
  // Cada año se construye una escuela en la celda más poblada sin escuela
  for (let k = 0; k < ticks; k++) {
    const decisiones = {}
    if (k % 4 === 0) {
      const sinEscuela = m.celdas.filter((c) => c.escuelas === 0).sort((a, b) => b.poblacion - a.poblacion)
      decisiones.nuevasEscuelas = [sinEscuela[0].id]
    }
    const r = tick(m, config, decisiones)
    m = r.mundo
    historial.push(m.indicadores)
    eventos.push(...r.eventos)
  }
  return { mundo: m, historial, eventos }
}

describe('integración: 40 trimestres con semilla fija', () => {
  const a = partida(1234)

  it('avanza el contador de ticks', () => {
    expect(a.mundo.tick).toBe(40)
  })

  it('es determinista', () => {
    const b = partida(1234)
    expect(JSON.stringify(b.mundo)).toBe(JSON.stringify(a.mundo))
    expect(b.eventos).toEqual(a.eventos)
  })

  it('no produce valores inválidos', () => {
    for (const i of a.historial) for (const v of Object.values(i)) expect(Number.isFinite(v)).toBe(true)
    for (const c of a.mundo.celdas) {
      for (const k of ['valorSuelo', 'poblacion', 'ninosEscolares', 'calidadEscuela', 'accesoEscuela']) {
        expect(Number.isFinite(c[k]), `${k} en celda ${c.id}`).toBe(true)
        expect(c[k]).toBeGreaterThanOrEqual(0)
      }
    }
    expect(a.mundo.presupuesto.deuda).toBeGreaterThanOrEqual(0)
  })

  it('construye las escuelas decididas y mejora la calidad escolar', () => {
    const ini = a.historial[0]
    const fin = a.historial.at(-1)
    expect(fin.escuelas).toBe(ini.escuelas + 10)
    expect(a.eventos.filter((e) => e.tipo === 'escuelaNueva')).toHaveLength(10)
    expect(fin.calidadEscolarMedia).toBeGreaterThan(ini.calidadEscolarMedia)
    expect(fin.valorSueloMedio).toBeGreaterThan(ini.valorSueloMedio)
  })

  it('los eventos llevan el tick en que ocurrieron', () => {
    for (const e of a.eventos) {
      expect(e.tick).toBeGreaterThanOrEqual(1)
      expect(e.tick).toBeLessThanOrEqual(40)
    }
  })

  it('no modifica el mundo de entrada', () => {
    const m = crearMundo({ celdas: celdasBarcelona(), config })
    const copia = JSON.stringify(m)
    tick(m, config, { nuevasEscuelas: [0] })
    expect(JSON.stringify(m)).toBe(copia)
  })
})
