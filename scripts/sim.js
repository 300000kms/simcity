// Corre la simulación en consola: npm run sim [-- ticks]
import { readFileSync } from 'node:fs'
import { config } from '../src/engine/config.js'
import { crearMundo } from '../src/engine/world.js'
import { tick } from '../src/engine/tick.js'
import { generarMalla, descriptoresCeldas } from '../src/map/grid.js'

const leer = (f) => JSON.parse(readFileSync(new URL(`../src/data/barcelona/${f}`, import.meta.url), 'utf8'))
const ticks = Number(process.argv[2] || 16)

const malla = generarMalla({ limite: leer('limite.geojson'), barrios: leer('barrios.geojson'), ...config.malla })
let mundo = crearMundo({ celdas: descriptoresCeldas(malla), config })

const fila = (m) => {
  const i = m.indicadores
  const p = m.presupuesto
  const t = `${2027 + Math.floor(m.tick / 4)}T${(m.tick % 4) + 1}`
  return [t, i.poblacion, i.ninosEscolares, i.escuelas, i.valorSueloMedio.toFixed(0), i.calidadEscolarMedia.toFixed(3),
    p.ingresos.toFixed(0), p.gastos.toFixed(0), p.saldo.toFixed(0), p.deuda.toFixed(0)].join('\t')
}
console.log(`${malla.features.length} celdas`)
console.log('trim\tpoblac\tniños\tescuel\tsuelo\tcalidad\tingres\tgastos\tsaldo\tdeuda')
console.log(fila(mundo))
for (let k = 0; k < ticks; k++) {
  ;({ mundo } = tick(mundo, config))
  console.log(fila(mundo))
}
