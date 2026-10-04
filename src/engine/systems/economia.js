// Nodo 4: familias y empresas (economía simulada).

/**
 * Enlace 23: la población genera un flujo de niños en edad escolar.
 * @param {Array<object>} celdas
 * @param {object} config
 * @returns {Array<object>} celdas nuevas
 */
export function calcularNinos(celdas, config) {
  const f = config.economia.fraccionNinos
  return celdas.map((c) => ({ ...c, ninosEscolares: c.poblacion * f }))
}

/**
 * Enlace 23 y 38: base fiscal, valor de mercado del parque construido (M€).
 * @param {Array<object>} celdas
 * @returns {number}
 */
export function calcularBaseFiscal(celdas) {
  let base = 0
  for (const c of celdas) base += c.area * c.densidad * c.valorSuelo
  return base / 1e6
}

/**
 * Paso de la economía: las familias se mueven hacia las celdas cuya calidad
 * escolar mejora y se alejan de las que se encarecen respecto al inicio.
 * Después se recalculan los niños en edad escolar (enlace 23).
 * @param {object} mundo
 * @param {object} config
 * @returns {{ mundo: object, eventos: Array<object> }}
 */
export function step(mundo, config) {
  const e = config.economia
  let celdas = mundo.celdas.map((c) => {
    // enlace 23: atractivo residencial por escuelas frente a precio del suelo
    const mejoraEscolar = c.calidadEscuela - c.calidadInicial
    const encarecimiento = c.valorSuelo / c.valorInicial - 1
    const atractivo = e.pesoCalidadEscolar * mejoraEscolar - e.pesoPrecio * encarecimiento
    const capacidad = c.area * c.densidad * e.habitantesPorM2
    const nueva = Math.max(0, c.poblacion * (1 + e.tasaMigracion * atractivo))
    // la capacidad residencial limita el crecimiento, pero no expulsa a quien ya vive allí
    const poblacion = nueva > c.poblacion ? Math.min(nueva, Math.max(capacidad, c.poblacion)) : nueva
    return { ...c, poblacion }
  })
  celdas = calcularNinos(celdas, config)
  return { mundo: { ...mundo, celdas }, eventos: [] }
}
