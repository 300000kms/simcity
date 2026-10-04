// Store reactivo de la simulación. Única vía por la que la vista toca el motor.
// El mundo completo (miles de celdas) vive fuera de la reactividad; el store
// solo expone los datos pequeños que pinta la interfaz.
import { reactive } from 'vue'
import { config } from '../engine/config.js'
import { crearMundo } from '../engine/world.js'
import { tick } from '../engine/tick.js'
import { fijarPartida } from '../engine/systems/presupuesto.js'

const MAX_EVENTOS = 60
const MS_POR_TICK = 1500

let mundo = null
let descriptores = null
let nombresBarrios = {}
let temporizador = null
const suscriptores = new Set()

export const store = reactive({
  listo: false,
  tick: 0,
  presupuesto: {},
  indicadores: {},
  distritos: [],
  historial: [],
  eventos: [],
  running: false,
  speed: 1,
  capa: 'valorSuelo',
  modo: 'inspeccionar', // inspeccionar | escuela
  seleccion: null,
  pendientes: [], // celdas donde se construirá una escuela el próximo trimestre
  finPartida: null
})

/** Mundo completo, sin reactividad. Solo para el mapa. */
export function getMundo() {
  return mundo
}

/**
 * Se llama tras cada cambio del mundo (tick, reinicio). Lo usa el mapa para
 * actualizar los feature-state sin watchers profundos.
 * @param {(mundo: object) => void} fn
 * @returns {() => void} función para darse de baja
 */
export function alCambiarMundo(fn) {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}

/**
 * Crea la partida a partir de la malla.
 * @param {object} opciones
 * @param {Array<object>} opciones.celdas descriptores de celda
 * @param {Object<number,string>} opciones.barrios nombre de cada barrio por id
 */
export function iniciar({ celdas, barrios }) {
  descriptores = celdas
  nombresBarrios = barrios
  reiniciar()
  store.listo = true
}

export function reiniciar() {
  pausar()
  mundo = crearMundo({ celdas: descriptores, config })
  store.historial = []
  store.eventos = []
  store.pendientes = []
  store.finPartida = null
  store.seleccion = null
  publicar()
}

export function avanzarTick() {
  if (!mundo || store.finPartida) return
  const r = tick(mundo, config, { nuevasEscuelas: store.pendientes })
  mundo = r.mundo
  store.pendientes = []
  const nuevos = r.eventos.map((e) => ({ ...e, texto: textoEvento(e) }))
  store.eventos = [...nuevos.reverse(), ...store.eventos].slice(0, MAX_EVENTOS)
  if (r.eventos.some((e) => e.tipo === 'quiebra')) {
    store.finPartida = 'La deuda ha superado el umbral de quiebra. La Generalitat interviene las cuentas.'
    pausar()
  }
  publicar()
}

/**
 * Cambia una partida anual del presupuesto (enlace 13).
 * @param {string} partida
 * @param {number} valor M€ anuales
 */
export function setPresupuesto(partida, valor) {
  mundo = fijarPartida(mundo, partida, valor, config)
  store.presupuesto = { ...mundo.presupuesto }
}

/** Marca o desmarca una celda para construir una escuela el próximo trimestre. */
export function marcarEscuela(id) {
  if (store.pendientes.includes(id)) {
    store.pendientes = store.pendientes.filter((x) => x !== id)
  } else if (costePendientes() + config.escuelas.costeConstruccion <= fondoDisponible()) {
    store.pendientes = [...store.pendientes, id]
  } else {
    store.eventos = [
      { tick: store.tick, tipo: 'aviso', texto: 'No queda fondo de inversión para otra escuela este trimestre.' },
      ...store.eventos
    ].slice(0, MAX_EVENTOS)
  }
  notificar()
}

export function seleccionarCelda(id) {
  store.seleccion = id === null ? null : fichaCelda(id)
}

export function setCapa(capa) {
  store.capa = capa
}

export function setModo(modo) {
  store.modo = modo
}

export function setVelocidad(v) {
  store.speed = v
  if (store.running) {
    pausar()
    reproducir()
  }
}

export function reproducir() {
  if (store.finPartida) return
  store.running = true
  temporizador = setInterval(avanzarTick, MS_POR_TICK / store.speed)
}

export function pausar() {
  store.running = false
  clearInterval(temporizador)
  temporizador = null
}

export function fondoDisponible() {
  return mundo ? mundo.presupuesto.fondoInversion + mundo.presupuesto.inversionCapital / config.tiempo.ticksPorAnio : 0
}

export function costePendientes() {
  return store.pendientes.length * config.escuelas.costeConstruccion
}

export function nombreBarrio(id) {
  return nombresBarrios[id] || `Barrio ${id}`
}

/** Etiqueta de fecha de un tick: el tick 0 es el primer trimestre de 2027. */
export function fecha(t) {
  return `${2027 + Math.floor(t / 4)} T${(t % 4) + 1}`
}

function publicar() {
  store.tick = mundo.tick
  store.presupuesto = { ...mundo.presupuesto }
  store.indicadores = { ...mundo.indicadores }
  store.distritos = mundo.distritos
  store.historial = [
    ...store.historial,
    {
      tick: mundo.tick,
      deuda: mundo.presupuesto.deuda,
      saldo: mundo.presupuesto.saldo,
      poblacion: mundo.indicadores.poblacion,
      valorSueloMedio: mundo.indicadores.valorSueloMedio,
      calidadEscolarMedia: mundo.indicadores.calidadEscolarMedia
    }
  ]
  if (store.seleccion) store.seleccion = fichaCelda(store.seleccion.id)
  notificar()
}

function notificar() {
  for (const fn of suscriptores) fn(mundo)
}

function fichaCelda(id) {
  const c = mundo.celdas[id]
  const distrito = config.distritos.find((d) => d.id === c.distrito)
  return {
    id: c.id,
    barrio: nombreBarrio(c.barrio),
    distrito: distrito.nombre,
    valorSuelo: c.valorSuelo,
    cambioSuelo: c.valorSuelo / c.valorInicial - 1,
    poblacion: c.poblacion,
    ninosEscolares: c.ninosEscolares,
    escuelas: c.escuelas,
    calidadEscuela: c.calidadEscuela,
    accesoEscuela: c.accesoEscuela
  }
}

function textoEvento(e) {
  if (e.celda !== undefined && mundo.celdas[e.celda]) {
    const barrio = nombreBarrio(mundo.celdas[e.celda].barrio)
    if (e.tipo === 'escuelaNueva') return `Se inaugura una escuela en ${barrio}.`
    if (e.tipo === 'escuelaRechazada') return `No hay fondos para la escuela de ${barrio}.`
  }
  return e.texto
}
