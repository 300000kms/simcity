<template>
  <section>
    <h2>Escuelas</h2>
    <div class="modos" role="radiogroup" aria-label="Modo de clic en el mapa">
      <button :class="{ activo: store.modo === 'inspeccionar' }" @click="setModo('inspeccionar')">Inspeccionar</button>
      <button :class="{ activo: store.modo === 'escuela' }" @click="setModo('escuela')">Colocar escuela</button>
    </div>
    <p class="ayuda">
      Fondo de inversión: <strong>{{ m(fondo) }}</strong>. Cada escuela cuesta {{ m(coste) }}.
      <template v-if="store.pendientes.length">
        {{ store.pendientes.length }} en proyecto ({{ m(costeProyecto) }}), se construyen al avanzar el trimestre.
      </template>
      <template v-else-if="store.modo === 'escuela'">Haz clic en una celda para proyectar una escuela.</template>
    </p>
  </section>
</template>

<script>
import { config } from '../engine/config.js'
import { store, setModo, fondoDisponible, costePendientes } from '../store/simulation.js'

export default {
  name: 'SchoolTools',
  data() {
    return { store, coste: config.escuelas.costeConstruccion }
  },
  computed: {
    fondo() {
      // depende de presupuesto y pendientes para recalcularse
      return this.store.presupuesto && fondoDisponible()
    },
    costeProyecto() {
      return this.store.pendientes.length && costePendientes()
    }
  },
  methods: {
    setModo,
    m(v) {
      return `${Math.round(v || 0).toLocaleString('es-ES')} M€`
    }
  }
}
</script>

<style scoped>
.modos { display: flex; gap: 6px; }
.modos button { flex: 1; }
.modos button.activo { background: var(--acento); color: #fff; border-color: var(--acento); }
.ayuda { font-size: 12px; color: var(--tinta-2); margin: 8px 0 0; }
</style>
