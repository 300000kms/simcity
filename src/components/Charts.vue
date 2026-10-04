<template>
  <section>
    <h2>Evolución</h2>
    <p v-if="store.historial.length < 2" class="vacio">Las series aparecen a partir del segundo trimestre.</p>
    <div v-else class="graficos">
      <figure v-for="s in series" :key="s.clave" class="grafico">
        <figcaption>
          <span>{{ s.nombre }}</span>
          <strong>{{ s.formato(valorMostrado(s)) }}</strong>
        </figcaption>
        <svg
          :viewBox="`0 0 ${W} ${H}`"
          preserveAspectRatio="none"
          role="img"
          :aria-label="`${s.nombre}: de ${s.formato(s.valores[0])} a ${s.formato(s.valores.at(-1))}`"
          @mousemove="mover($event)"
          @mouseleave="indice = null"
        >
          <line :x1="0" :x2="W" :y1="H - 1" :y2="H - 1" class="base" />
          <path :d="camino(s.valores)" class="serie" vector-effect="non-scaling-stroke" />
          <line v-if="indice !== null" :x1="x(indice)" :x2="x(indice)" y1="0" :y2="H" class="cruz" vector-effect="non-scaling-stroke" />
        </svg>
        <div class="eje">
          <span>{{ s.formato(min(s.valores)) }} – {{ s.formato(max(s.valores)) }}</span>
          <span>{{ indice !== null ? fecha(store.historial[indice].tick) : '' }}</span>
        </div>
      </figure>
    </div>
  </section>
</template>

<script>
import { store, fecha } from '../store/simulation.js'

const M = (v) => `${Math.round(v).toLocaleString('es-ES')} M€`

export default {
  name: 'Charts',
  data() {
    return { store, indice: null, W: 300, H: 48 }
  },
  computed: {
    series() {
      const h = this.store.historial
      const def = [
        { clave: 'deuda', nombre: 'Deuda', formato: M },
        { clave: 'saldo', nombre: 'Saldo trimestral', formato: M },
        { clave: 'poblacion', nombre: 'Población', formato: (v) => Math.round(v).toLocaleString('es-ES') },
        { clave: 'valorSueloMedio', nombre: 'Valor medio del suelo', formato: (v) => `${Math.round(v).toLocaleString('es-ES')} €/m²` },
        { clave: 'calidadEscolarMedia', nombre: 'Calidad escolar media', formato: (v) => v.toFixed(3) }
      ]
      return def.map((d) => ({ ...d, valores: h.map((p) => p[d.clave]) }))
    }
  },
  methods: {
    fecha,
    min: (v) => Math.min(...v),
    max: (v) => Math.max(...v),
    x(i) {
      return (i / Math.max(1, this.store.historial.length - 1)) * this.W
    },
    camino(valores) {
      const a = Math.min(...valores)
      const b = Math.max(...valores)
      const rango = b - a || 1
      return valores
        .map((v, i) => `${i ? 'L' : 'M'}${this.x(i).toFixed(1)},${(this.H - 3 - ((v - a) / rango) * (this.H - 6)).toFixed(1)}`)
        .join('')
    },
    mover(e) {
      const r = e.currentTarget.getBoundingClientRect()
      const n = this.store.historial.length
      this.indice = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))))
    },
    valorMostrado(s) {
      return s.valores[this.indice ?? s.valores.length - 1]
    }
  }
}
</script>

<style scoped>
.graficos { display: grid; gap: 10px; }
.grafico { margin: 0; }
figcaption { display: flex; justify-content: space-between; font-size: 12px; color: var(--tinta-2); }
figcaption strong { color: var(--tinta); font-variant-numeric: tabular-nums; }
svg { width: 100%; height: 48px; display: block; cursor: crosshair; }
.serie { fill: none; stroke: var(--acento); stroke-width: 2; stroke-linejoin: round; }
.base { stroke: var(--linea); stroke-width: 1; }
.cruz { stroke: var(--tinta-2); stroke-width: 1; }
.eje { display: flex; justify-content: space-between; font-size: 10px; color: var(--tinta-2); font-variant-numeric: tabular-nums; }
.vacio { font-size: 12px; color: var(--tinta-2); margin: 0; }
</style>
