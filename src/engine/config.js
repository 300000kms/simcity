// Parámetros del simulador. Ningún peso, coste o elasticidad vive fuera de este archivo.
// Unidades: dinero en millones de euros (M€), valor del suelo en €/m² construido,
// tiempo en trimestres (1 tick = 1 trimestre).

export const config = {
  semilla: 20260101,

  tiempo: {
    ticksPorAnio: 4,
    ticksPorMandato: 16 // elecciones cada 4 años
  },

  mapa: {
    centro: [2.1734, 41.3851], // lng, lat
    // Verificado contra el límite oficial (unión de los 10 distritos de CartoBCN)
    bbox: [2.0523, 41.317, 2.228, 41.4683],
    margenBbox: 0.02, // grados añadidos a maxBounds
    minZoom: 11,
    maxZoom: 17
  },

  malla: {
    tamanoCelda: 0.25, // km de lado (≈ 2300 celdas)
    areaMinima: 0.15 // fracción mínima de celda que se conserva al recortar con el límite
  },

  // Datos iniciales por distrito. Aproximaciones plausibles (orden de magnitud real
  // de 2023), a refinar con Open Data BCN.
  // renta: índice de renta familiar disponible (Barcelona = 100)
  // valorSuelo: €/m² construido residencial
  // densidad: m² construidos por m² de suelo (edificabilidad media)
  distritos: [
    { id: 1, nombre: 'Ciutat Vella', poblacion: 109000, renta: 72, valorSuelo: 4300, densidad: 3.2 },
    { id: 2, nombre: 'Eixample', poblacion: 270000, renta: 117, valorSuelo: 5200, densidad: 3.6 },
    { id: 3, nombre: 'Sants-Montjuïc', poblacion: 186000, renta: 77, valorSuelo: 3500, densidad: 1.2 },
    { id: 4, nombre: 'Les Corts', poblacion: 82000, renta: 141, valorSuelo: 5500, densidad: 1.6 },
    { id: 5, nombre: 'Sarrià-Sant Gervasi', poblacion: 150000, renta: 183, valorSuelo: 6200, densidad: 0.9 },
    { id: 6, nombre: 'Gràcia', poblacion: 123000, renta: 107, valorSuelo: 4800, densidad: 2.6 },
    { id: 7, nombre: 'Horta-Guinardó', poblacion: 175000, renta: 82, valorSuelo: 3300, densidad: 1.3 },
    { id: 8, nombre: 'Nou Barris', poblacion: 172000, renta: 57, valorSuelo: 2600, densidad: 1.7 },
    { id: 9, nombre: 'Sant Andreu', poblacion: 151000, renta: 77, valorSuelo: 3300, densidad: 1.7 },
    { id: 10, nombre: 'Sant Martí', poblacion: 240000, renta: 89, valorSuelo: 4500, densidad: 2.0 }
  ],

  inicial: {
    ruidoValorSuelo: 0.15, // variación aleatoria ± entre celdas de un mismo distrito
    ruidoPoblacion: 0.4,
    rentaMediaCiudad: 21000, // € por persona y año para el índice 100
    plazasPorEscuela: 450,
    coberturaInicialEscuelas: 0.95 // plazas iniciales respecto a la demanda escolar
  },

  presupuesto: {
    // Partidas anuales iniciales (M€). El jugador las cambia con sliders.
    gastoCorriente: 2350,
    inversionCapital: 450,
    financiacionEscuelas: 300,
    deudaInicial: 800,
    // Enlace 38: impuestos sobre la base fiscal (valor de mercado del parque construido)
    tipoImpositivoAnual: 0.0025, // calibrado: déficit inicial leve
    transferenciasAnuales: 1300, // participación en tributos del Estado y Generalitat
    tipoInteresAnual: 0.03,
    umbralQuiebra: 6000, // deuda que provoca la quiebra
    limites: { min: 0, max: 6000 } // rango de cada partida para la interfaz
  },

  escuelas: {
    costeConstruccion: 12, // M€ por escuela nueva (sale del fondo de inversión)
    gastoReferenciaPorAlumno: 0.0016, // M€ por alumno y año que da calidad 1 (1600 €)
    exponenteGasto: 0.6, // rendimientos decrecientes del gasto
    radioInfluencia: 3, // celdas: alcance de una escuela sobre su entorno
    pesoAcceso: 0.5 // peso de la proximidad a una escuela en la calidad de la celda
  },

  economia: {
    // Enlace 23: fracción de población en edad escolar (3 a 16 años)
    fraccionNinos: 0.13,
    // Migración interna por trimestre según atractivo relativo de la celda
    tasaMigracion: 0.01,
    pesoCalidadEscolar: 1.0,
    pesoPrecio: 0.6, // cuánto expulsa un suelo caro respecto a la renta del distrito
    habitantesPorM2: 0.025 // capacidad residencial: hab por m² construido
  },

  territorio: {
    // Enlace 24: la localización y calidad de las escuelas mueven el valor del suelo
    elasticidadCalidadEscolar: 0.25,
    primaProximidadEscuela: 0.06,
    calidadReferencia: 0.7,
    velocidadAjuste: 0.08 // fracción de la distancia al objetivo que se recorre por trimestre
  }
}

export default config
