// Orquesta un paso de simulación (un trimestre).
// Fase 1: solo los flujos 38 (impuestos), 23 (niños y base fiscal) y 24 (escuelas y suelo).
import { crearRng } from './rng.js'
import { calcularIndicadores, resumenDistritos } from './world.js'
import * as presupuesto from './systems/presupuesto.js'
import * as territorio from './systems/territorio.js'
import * as economia from './systems/economia.js'

/**
 * Avanza el mundo un trimestre. No modifica el mundo recibido.
 * @param {object} mundo
 * @param {object} config
 * @param {object} [decisiones] decisiones del jugador para este trimestre
 * @param {number[]} [decisiones.nuevasEscuelas] ids de celda donde construir escuelas
 * @returns {{ mundo: object, eventos: Array<object> }}
 */
export function tick(mundo, config, decisiones = {}) {
  const rng = crearRng(mundo.rngEstado)
  const eventos = []
  const aplicar = (r) => {
    eventos.push(...r.eventos)
    return r.mundo
  }

  let m = mundo
  // 1. Ingresos: la economía genera base fiscal y entran impuestos y bonos (38)
  m = aplicar(presupuesto.step(m, config))
  // 2-4. Planners, presión de los actores y reparto del alcalde: fase 3
  // 5. Se ejecuta el gasto: aparecen escuelas
  m = aplicar(presupuesto.ejecutarInversiones(m, config, decisiones.nuevasEscuelas))
  // 6. Efectos: escuelas y valor del suelo (24), población y niños (23)
  m = aplicar(territorio.step(m, config))
  m = aplicar(economia.step(m, config))

  const siguiente = { ...m, tick: mundo.tick + 1, rngEstado: rng.estado() }
  const conTick = eventos.map((e) => ({ tick: siguiente.tick, ...e }))
  return {
    mundo: { ...siguiente, indicadores: calcularIndicadores(siguiente), distritos: resumenDistritos(siguiente, config) },
    eventos: conTick
  }
}
