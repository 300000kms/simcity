<template>
  <section v-if="c" class="ficha">
    <div class="cabecera">
      <h2>{{ c.barrio }}</h2>
      <button class="discreto" aria-label="Cerrar ficha" @click="seleccionarCelda(null)">×</button>
    </div>
    <p class="distrito">{{ c.distrito }} · celda {{ c.id }}</p>
    <dl>
      <dt>Valor del suelo</dt><dd>{{ euros(c.valorSuelo) }} <span :class="c.cambioSuelo < 0 ? 'neg' : 'pos'">({{ pct(c.cambioSuelo) }})</span></dd>
      <dt>Población</dt><dd>{{ n(c.poblacion) }}</dd>
      <dt>Niños en edad escolar</dt><dd>{{ n(c.ninosEscolares) }}</dd>
      <dt>Escuelas en la celda</dt><dd>{{ c.escuelas }}</dd>
      <dt>Calidad escolar</dt><dd>{{ c.calidadEscuela.toFixed(2) }}</dd>
      <dt>Proximidad a escuela</dt><dd>{{ c.accesoEscuela.toFixed(2) }}</dd>
    </dl>
  </section>
</template>

<script>
import { store, seleccionarCelda } from '../store/simulation.js'

export default {
  name: 'CellInfo',
  data() {
    return { store }
  },
  computed: {
    c() {
      return this.store.seleccion
    }
  },
  methods: {
    seleccionarCelda,
    n: (v) => Math.round(v).toLocaleString('es-ES'),
    euros: (v) => `${Math.round(v).toLocaleString('es-ES')} €/m²`,
    pct: (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)} %`
  }
}
</script>

<style scoped>
.cabecera { display: flex; justify-content: space-between; align-items: center; }
.cabecera button { font-size: 18px; line-height: 1; padding: 0 8px; }
.distrito { margin: 0 0 6px; color: var(--tinta-2); font-size: 12px; }
dl { display: grid; grid-template-columns: 1fr auto; gap: 2px 8px; margin: 0; font-size: 13px; }
dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
.neg { color: #b42f2f; }
.pos { color: #0a7a0a; }
</style>
