import { describe, it, expect } from 'vitest'
import nodes from '../src/engine/graph/nodes.json'
import links from '../src/engine/graph/links.json'

const TIPOS = ['dinero', 'informacion', 'apoyo', 'demanda', 'decision', 'mercado', 'efecto', 'oculto']

describe('grafo del esquema', () => {
  it('tiene los 8 nodos numerados del 1 al 8', () => {
    expect(nodes.map((n) => n.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('tiene los enlaces 9 a 40, sin huecos ni repeticiones', () => {
    expect(links.map((l) => l.id)).toEqual(Array.from({ length: 32 }, (_, i) => i + 9))
  })

  it('cada enlace une nodos existentes con un tipo conocido', () => {
    const claves = new Set(nodes.map((n) => n.clave))
    for (const l of links) {
      expect(claves.has(l.from), `origen de ${l.id}`).toBe(true)
      expect(claves.has(l.to), `destino de ${l.id}`).toBe(true)
      expect(l.from).not.toBe(l.to)
      expect(TIPOS).toContain(l.type)
      expect(l.label.length).toBeGreaterThan(0)
    }
  })

  it('respeta los tipos de enlace del modelo', () => {
    const tipo = Object.fromEntries(links.map((l) => [l.id, l.type]))
    const esperado = {
      dinero: [38, 39, 9],
      informacion: [11, 12, 18, 29, 31],
      apoyo: [14, 15, 22, 30, 32],
      demanda: [16, 19, 20, 21, 35],
      decision: [10, 13, 26],
      mercado: [33, 34, 36, 37]
    }
    for (const [t, ids] of Object.entries(esperado)) for (const id of ids) expect(tipo[id], `enlace ${id}`).toBe(t)
  })
})
