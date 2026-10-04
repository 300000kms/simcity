// Estado del mundo y creación inicial.
// El mundo es un objeto plano y serializable. Las funciones del motor no lo
// modifican: devuelven uno nuevo.
import { crearRng } from './rng.js'
import { calcularAccesoEscuelas, calcularCalidadEscolar, factorEscolar } from './systems/territorio.js'
import { calcularNinos } from './systems/economia.js'

/**
 * @typedef {object} Celda
 * @property {number} id
 * @property {number} fila
 * @property {number} col
 * @property {number} barrio
 * @property {number} distrito
 * @property {number} area m² de suelo
 * @property {string} uso residencial | mixto | actividad | equipamiento | verde
 * @property {number} densidad m² construidos por m² de suelo
 * @property {number} valorSuelo €/m² construido
 * @property {number} valorSueloBase valor sin el efecto de las escuelas (enlace 24)
 * @property {number} valorInicial
 * @property {number} poblacion
 * @property {number} ninosEscolares
 * @property {number} rentaMedia € por persona y año
 * @property {number} escuelas número de escuelas en la celda
 * @property {number} accesoEscuela 0..1, proximidad a la escuela más cercana
 * @property {number} calidadEscuela 0..1
 * @property {number} calidadInicial
 * @property {number} servicios 0..1
 */

/**
 * Crea el mundo inicial a partir de los descriptores de celda de la malla.
 * @param {object} opciones
 * @param {Array<{id:number, fila:number, col:number, barrio:number, distrito:number, area:number}>} opciones.celdas
 * @param {object} opciones.config configuración (engine/config.js)
 * @param {number} [opciones.semilla] por defecto config.semilla
 * @returns {object} mundo
 */
export function crearMundo({ celdas, config, semilla = config.semilla }) {
  const rng = crearRng(semilla)
  const ini = config.inicial
  const porDistrito = new Map(config.distritos.map((d) => [d.id, d]))

  // Población repartida dentro de cada distrito con un peso aleatorio por celda
  const pesos = celdas.map((c) => c.area * (1 + rng.entre(-ini.ruidoPoblacion, ini.ruidoPoblacion)))
  const pesoDistrito = new Map()
  celdas.forEach((c, i) => pesoDistrito.set(c.distrito, (pesoDistrito.get(c.distrito) || 0) + pesos[i]))

  let lista = celdas.map((c, i) => {
    const d = porDistrito.get(c.distrito)
    const valor = d.valorSuelo * (1 + rng.entre(-ini.ruidoValorSuelo, ini.ruidoValorSuelo))
    const poblacion = Math.round((d.poblacion * pesos[i]) / pesoDistrito.get(c.distrito))
    return {
      id: c.id,
      fila: c.fila,
      col: c.col,
      barrio: c.barrio,
      distrito: c.distrito,
      area: c.area,
      uso: 'residencial',
      densidad: d.densidad,
      valorSuelo: valor,
      valorSueloBase: valor,
      valorInicial: valor,
      poblacion,
      ninosEscolares: 0,
      rentaMedia: (d.renta / 100) * ini.rentaMediaCiudad,
      escuelas: 0,
      accesoEscuela: 0,
      calidadEscuela: 0,
      calidadInicial: 0,
      servicios: 0.5
    }
  })
  lista = calcularNinos(lista, config) // enlace 23

  // Escuelas iniciales: por distrito, las necesarias para cubrir la demanda,
  // colocadas en celdas elegidas con probabilidad proporcional a sus niños
  for (const d of config.distritos) {
    const propias = lista.filter((c) => c.distrito === d.id)
    const ninos = propias.reduce((s, c) => s + c.ninosEscolares, 0)
    const n = Math.round((ninos * ini.coberturaInicialEscuelas) / ini.plazasPorEscuela)
    for (let k = 0; k < n; k++) elegirPonderado(propias, (c) => c.ninosEscolares, rng).escuelas += 1
  }

  const presupuesto = {
    gastoCorriente: config.presupuesto.gastoCorriente,
    inversionCapital: config.presupuesto.inversionCapital,
    financiacionEscuelas: config.presupuesto.financiacionEscuelas,
    repartoEscuelas: null, // pesos por distrito; null = proporcional a los niños
    ingresos: 0,
    ingresosImpuestos: 0,
    gastos: 0,
    intereses: 0,
    saldo: 0,
    deuda: config.presupuesto.deudaInicial,
    remanente: 0,
    fondoInversion: 0,
    baseFiscal: 0
  }

  let mundo = { tick: 0, semilla, rngEstado: rng.estado(), presupuesto, celdas: lista }
  mundo = { ...mundo, celdas: calcularAccesoEscuelas(mundo.celdas, config) }
  mundo = { ...mundo, celdas: calcularCalidadEscolar(mundo, config) }

  // El estado inicial es un equilibrio: el valor base descuenta el efecto
  // de las escuelas de partida, de modo que solo los cambios mueven el suelo (enlace 24)
  mundo.celdas = mundo.celdas.map((c) => ({
    ...c,
    calidadInicial: c.calidadEscuela,
    valorSueloBase: c.valorSuelo / factorEscolar(c, config)
  }))

  return { ...mundo, indicadores: calcularIndicadores(mundo), distritos: resumenDistritos(mundo, config) }
}

/**
 * Indicadores agregados de la ciudad.
 * @param {object} mundo
 * @returns {object}
 */
export function calcularIndicadores(mundo) {
  let poblacion = 0
  let ninos = 0
  let escuelas = 0
  let sumaValor = 0
  let sumaCalidad = 0
  let renta = 0
  let construido = 0
  for (const c of mundo.celdas) {
    const m2 = c.area * c.densidad
    poblacion += c.poblacion
    ninos += c.ninosEscolares
    escuelas += c.escuelas
    sumaValor += c.valorSuelo * m2
    construido += m2
    sumaCalidad += c.calidadEscuela * c.ninosEscolares
    renta += c.rentaMedia * c.poblacion
  }
  return {
    poblacion: Math.round(poblacion),
    ninosEscolares: Math.round(ninos),
    escuelas,
    valorSueloMedio: sumaValor / construido,
    calidadEscolarMedia: ninos > 0 ? sumaCalidad / ninos : 0,
    rentaMedia: poblacion > 0 ? renta / poblacion : 0,
    deuda: mundo.presupuesto.deuda,
    saldo: mundo.presupuesto.saldo
  }
}

/**
 * Resumen por distrito: unidad territorial de electores e informes.
 * @param {object} mundo
 * @param {object} config
 * @returns {Array<object>}
 */
export function resumenDistritos(mundo, config) {
  return config.distritos.map((d) => {
    const propias = mundo.celdas.filter((c) => c.distrito === d.id)
    const ninos = propias.reduce((s, c) => s + c.ninosEscolares, 0)
    const m2 = propias.reduce((s, c) => s + c.area * c.densidad, 0)
    return {
      id: d.id,
      nombre: d.nombre,
      celdas: propias.length,
      poblacion: Math.round(propias.reduce((s, c) => s + c.poblacion, 0)),
      ninosEscolares: Math.round(ninos),
      escuelas: propias.reduce((s, c) => s + c.escuelas, 0),
      valorSueloMedio: propias.reduce((s, c) => s + c.valorSuelo * c.area * c.densidad, 0) / m2,
      calidadEscuela: ninos > 0 ? propias.reduce((s, c) => s + c.calidadEscuela * c.ninosEscolares, 0) / ninos : 0
    }
  })
}

function elegirPonderado(lista, peso, rng) {
  const total = lista.reduce((s, x) => s + peso(x), 0)
  let r = rng.siguiente() * total
  for (const x of lista) {
    r -= peso(x)
    if (r <= 0) return x
  }
  return lista[lista.length - 1]
}
