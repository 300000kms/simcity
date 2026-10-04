// Nodo 1: presupuesto urbano (gasto corriente, inversión de capital, financiación escolar).
import { calcularBaseFiscal } from './economia.js'

export const PARTIDAS = ['gastoCorriente', 'inversionCapital', 'financiacionEscuelas']

/**
 * Paso del presupuesto en un trimestre.
 * Enlace 38: impuestos sobre la base fiscal y bonos (deuda) cubren el déficit.
 * @param {object} mundo
 * @param {object} config
 * @returns {{ mundo: object, eventos: Array<object> }}
 */
export function step(mundo, config) {
  const cfg = config.presupuesto
  const t = config.tiempo.ticksPorAnio
  const p = mundo.presupuesto
  const eventos = []

  // enlace 38: impuestos según la base fiscal que genera el territorio (enlace 23)
  const baseFiscal = calcularBaseFiscal(mundo.celdas)
  const ingresosImpuestos = (baseFiscal * cfg.tipoImpositivoAnual) / t
  const ingresos = ingresosImpuestos + cfg.transferenciasAnuales / t

  const gastos = (p.gastoCorriente + p.inversionCapital + p.financiacionEscuelas) / t
  const intereses = (p.deuda * cfg.tipoInteresAnual) / t
  const saldo = ingresos - gastos - intereses

  // enlace 38: el déficit se financia con bonos; el superávit amortiza deuda
  const neto = p.deuda - p.remanente - saldo
  const deuda = Math.max(0, neto)
  const remanente = Math.max(0, -neto)

  if (deuda > cfg.umbralQuiebra) {
    eventos.push({ tipo: 'quiebra', enlace: 38, texto: 'La deuda supera el umbral de quiebra.' })
  } else if (saldo < 0 && p.saldo >= 0) {
    // solo se avisa cuando las cuentas pasan a déficit, no en cada trimestre
    eventos.push({ tipo: 'deficit', enlace: 38, texto: `Las cuentas entran en déficit (${(-saldo).toFixed(0)} M€ por trimestre), se emiten bonos.` })
  } else if (saldo > 0 && p.saldo < 0) {
    eventos.push({ tipo: 'superavit', enlace: 38, texto: `Las cuentas vuelven al superávit (${saldo.toFixed(0)} M€ por trimestre).` })
  }

  const presupuesto = {
    ...p,
    baseFiscal,
    ingresosImpuestos,
    ingresos,
    gastos,
    intereses,
    saldo,
    deuda,
    remanente,
    // la inversión de capital se acumula en un fondo con el que se construyen escuelas
    fondoInversion: p.fondoInversion + p.inversionCapital / t
  }
  return { mundo: { ...mundo, presupuesto }, eventos }
}

/**
 * Cambia una partida anual del presupuesto (enlace 13).
 * @param {object} mundo
 * @param {string} partida una de PARTIDAS
 * @param {number} valor M€ anuales
 * @param {object} config
 * @returns {object} mundo nuevo
 */
export function fijarPartida(mundo, partida, valor, config) {
  if (!PARTIDAS.includes(partida)) throw new Error(`Partida desconocida: ${partida}`)
  const { min, max } = config.presupuesto.limites
  const v = Math.min(max, Math.max(min, Number(valor)))
  return { ...mundo, presupuesto: { ...mundo.presupuesto, [partida]: v } }
}

/**
 * Ejecuta los proyectos de inversión: construye escuelas con el fondo de inversión.
 * Si no hay fondos, el proyecto se rechaza.
 * @param {object} mundo
 * @param {object} config
 * @param {number[]} nuevasEscuelas ids de celda
 * @returns {{ mundo: object, eventos: Array<object> }}
 */
export function ejecutarInversiones(mundo, config, nuevasEscuelas = []) {
  const coste = config.escuelas.costeConstruccion
  let fondo = mundo.presupuesto.fondoInversion
  const construidas = new Map()
  const eventos = []
  for (const id of nuevasEscuelas) {
    if (!mundo.celdas[id]) continue
    if (fondo < coste) {
      eventos.push({ tipo: 'escuelaRechazada', celda: id, texto: 'Fondo de inversión insuficiente para la escuela.' })
      continue
    }
    fondo -= coste
    construidas.set(id, (construidas.get(id) || 0) + 1)
    eventos.push({ tipo: 'escuelaNueva', celda: id, enlace: 24, texto: 'Se inaugura una escuela.' })
  }
  if (construidas.size === 0) return { mundo, eventos }
  const celdas = mundo.celdas.map((c) =>
    construidas.has(c.id) ? { ...c, escuelas: c.escuelas + construidas.get(c.id) } : c
  )
  return { mundo: { ...mundo, celdas, presupuesto: { ...mundo.presupuesto, fondoInversion: fondo } }, eventos }
}
