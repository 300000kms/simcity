// Nodo 3: características socioeconómicas y ecología urbana (valor del suelo, usos).

/**
 * Proximidad de cada celda a la escuela más cercana, de 0 a 1.
 * Una celda con escuela vale 1 y el efecto cae linealmente hasta el radio de influencia.
 * @param {Array<object>} celdas
 * @param {object} config
 * @returns {Array<object>} celdas nuevas
 */
export function calcularAccesoEscuelas(celdas, config) {
  const r = config.escuelas.radioInfluencia
  const indice = new Map(celdas.map((c, i) => [c.fila + ',' + c.col, i]))
  const acceso = new Float64Array(celdas.length)
  celdas.forEach((c) => {
    if (c.escuelas <= 0) return
    for (let df = -r; df <= r; df++) {
      for (let dc = -r; dc <= r; dc++) {
        const i = indice.get(c.fila + df + ',' + (c.col + dc))
        if (i === undefined) continue
        const valor = 1 - Math.hypot(df, dc) / (r + 1)
        if (valor > acceso[i]) acceso[i] = valor
      }
    }
  })
  return celdas.map((c, i) => ({ ...c, accesoEscuela: acceso[i] }))
}

/**
 * Calidad escolar por celda. Depende del gasto por alumno de su distrito,
 * de la cobertura de plazas y de la proximidad a una escuela.
 * Es el nivel de calidad que permite el presupuesto escolar (enlace 19).
 * @param {object} mundo
 * @param {object} config
 * @returns {Array<object>} celdas nuevas
 */
export function calcularCalidadEscolar(mundo, config) {
  const esc = config.escuelas
  const p = mundo.presupuesto
  const plazasPorEscuela = config.inicial.plazasPorEscuela

  const ninos = new Map()
  const plazas = new Map()
  for (const c of mundo.celdas) {
    ninos.set(c.distrito, (ninos.get(c.distrito) || 0) + c.ninosEscolares)
    plazas.set(c.distrito, (plazas.get(c.distrito) || 0) + c.escuelas * plazasPorEscuela)
  }
  const totalNinos = [...ninos.values()].reduce((s, x) => s + x, 0)
  const pesoTotal = p.repartoEscuelas
    ? Object.values(p.repartoEscuelas).reduce((s, x) => s + x, 0)
    : totalNinos

  const calidadDistrito = new Map()
  for (const [d, n] of ninos) {
    const peso = p.repartoEscuelas ? p.repartoEscuelas[d] || 0 : n
    const fondos = pesoTotal > 0 ? (p.financiacionEscuelas * peso) / pesoTotal : 0
    const gastoPorAlumno = n > 0 ? fondos / n : 0
    const porGasto = Math.min(1, Math.pow(gastoPorAlumno / esc.gastoReferenciaPorAlumno, esc.exponenteGasto))
    const cobertura = n > 0 ? Math.min(1, plazas.get(d) / n) : 1
    calidadDistrito.set(d, porGasto * cobertura)
  }

  return mundo.celdas.map((c) => ({
    ...c,
    calidadEscuela: calidadDistrito.get(c.distrito) * (1 - esc.pesoAcceso + esc.pesoAcceso * c.accesoEscuela)
  }))
}

/**
 * Multiplicador del valor del suelo debido a las escuelas (enlace 24).
 * @param {Celda} celda
 * @param {object} config
 * @returns {number}
 */
export function factorEscolar(celda, config) {
  const t = config.territorio
  return (
    1 +
    t.elasticidadCalidadEscolar * (celda.calidadEscuela - t.calidadReferencia) +
    t.primaProximidadEscuela * celda.accesoEscuela
  )
}

/**
 * Paso del territorio: recalcula acceso y calidad escolar y ajusta el valor del suelo.
 * @param {object} mundo
 * @param {object} config
 * @returns {{ mundo: object, eventos: Array<object> }}
 */
export function step(mundo, config) {
  let celdas = calcularAccesoEscuelas(mundo.celdas, config)
  celdas = calcularCalidadEscolar({ ...mundo, celdas }, config)
  const v = config.territorio.velocidadAjuste
  celdas = celdas.map((c) => {
    // enlace 24: la localización y calidad de las escuelas influyen en el valor del suelo
    const objetivo = c.valorSueloBase * factorEscolar(c, config)
    return { ...c, valorSuelo: c.valorSuelo + v * (objetivo - c.valorSuelo) }
  })
  return { mundo: { ...mundo, celdas }, eventos: [] }
}
