import { describe, it, expect } from 'vitest'
import { config } from '../src/engine/config.js'
import { crearMundo } from '../src/engine/world.js'
import { mallaSintetica, celdasBarcelona } from './helpers.js'

describe('mundo inicial', () => {
  it('reparte la población de cada distrito entre sus celdas', () => {
    const m = crearMundo({ celdas: celdasBarcelona(), config })
    for (const d of config.distritos) {
      const resumen = m.distritos.find((x) => x.id === d.id)
      expect(Math.abs(resumen.poblacion - d.poblacion)).toBeLessThan(resumen.celdas) // error de redondeo
      expect(resumen.escuelas).toBeGreaterThan(0)
    }
  })

  it('es determinista con la misma semilla y cambia con otra', () => {
    const a = crearMundo({ celdas: mallaSintetica(), config, semilla: 1 })
    const b = crearMundo({ celdas: mallaSintetica(), config, semilla: 1 })
    const c = crearMundo({ celdas: mallaSintetica(), config, semilla: 2 })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c))
  })

  it('es serializable', () => {
    const m = crearMundo({ celdas: mallaSintetica(), config })
    expect(JSON.parse(JSON.stringify(m))).toEqual(m)
  })
})
