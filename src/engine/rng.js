// Generador aleatorio con semilla (mulberry32). Misma semilla, misma partida.
// El estado es un entero de 32 bits que se guarda en el mundo para poder
// reanudar la secuencia exactamente donde quedó.

/**
 * Crea un generador a partir de una semilla o de un estado guardado.
 * @param {number} semilla entero
 * @returns {{ siguiente: () => number, entre: (a:number, b:number) => number,
 *   entero: (a:number, b:number) => number, elegir: (lista:any[]) => any, estado: () => number }}
 */
export function crearRng(semilla) {
  let s = semilla >>> 0

  function siguiente() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    siguiente,
    /** Real uniforme en [a, b) */
    entre: (a, b) => a + (b - a) * siguiente(),
    /** Entero uniforme en [a, b] */
    entero: (a, b) => a + Math.floor((b - a + 1) * siguiente()),
    elegir: (lista) => lista[Math.floor(lista.length * siguiente())],
    estado: () => s
  }
}
