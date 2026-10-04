<template>
  <div class="app">
    <aside class="panel">
      <header>
        <h1>Simulador urbano de Barcelona</h1>
        <p class="subtitulo">Eres el alcalde. Reparte el presupuesto, coloca escuelas y mira cómo reacciona la ciudad.</p>
      </header>
      <template v-if="store.listo">
        <TimeControls class="bloque" />
        <CellInfo class="bloque" />
        <BudgetPanel class="bloque" />
        <SchoolTools class="bloque" />
        <Charts class="bloque" />
        <EventFeed class="bloque" />
        <p class="nota">
          Versión de desarrollo (fase 1 y 2). Por ahora solo funcionan los flujos de impuestos (38), niños en edad
          escolar (23) y escuelas y valor del suelo (24). Los actores y las elecciones llegarán más adelante.
        </p>
      </template>
    </aside>
    <main class="zona-mapa">
      <MapView v-if="datos" :datos="datos" />
      <div v-else class="cargando">{{ error || 'Generando la malla de Barcelona…' }}</div>
    </main>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import MapView from './components/MapView.vue'
import TimeControls from './components/TimeControls.vue'
import BudgetPanel from './components/BudgetPanel.vue'
import SchoolTools from './components/SchoolTools.vue'
import CellInfo from './components/CellInfo.vue'
import Charts from './components/Charts.vue'
import EventFeed from './components/EventFeed.vue'
import { store, iniciar } from './store/simulation.js'
import { cargarBarcelona } from './data/cargar.js'

export default {
  name: 'App',
  components: { MapView, TimeControls, BudgetPanel, SchoolTools, CellInfo, Charts, EventFeed },
  data() {
    return { store, datos: null, error: '' }
  },
  mounted() {
    // se deja pintar el aviso de carga antes de generar la malla
    setTimeout(() => {
      try {
        const datos = cargarBarcelona()
        iniciar({ celdas: datos.celdas, barrios: datos.nombresBarrios })
        this.datos = markRaw(datos)
      } catch (e) {
        this.error = `No se pudo cargar el mapa: ${e.message}`
        throw e
      }
    }, 30)
  }
}
</script>

<style>
:root {
  --fondo: #f4f3ef;
  --superficie: #fcfcfb;
  --tinta: #0b0b0b;
  --tinta-2: #52514e;
  --linea: #e1e0d9;
  --acento: #2a78d6;
  --escuela: #eb6834;
  color-scheme: light;
}
* { box-sizing: border-box; }
html, body, #app { height: 100%; margin: 0; }
body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: var(--fondo); color: var(--tinta); }
h1 { font-size: 18px; margin: 0 0 4px; }
h2 { font-size: 14px; margin: 0 0 8px; }
h3 { font-size: 13px; margin: 12px 0 4px; }
button, select {
  font: inherit; font-size: 13px; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--linea);
  background: var(--superficie); color: var(--tinta); cursor: pointer;
}
button:disabled { opacity: 0.5; cursor: default; }
button.primario { background: var(--acento); color: #fff; border-color: var(--acento); }
button.discreto { background: transparent; }
input[type='range'] { accent-color: var(--acento); }
</style>

<style scoped>
.app { display: grid; grid-template-columns: 360px 1fr; height: 100%; }
.panel { overflow-y: auto; padding: 16px; background: var(--fondo); border-right: 1px solid var(--linea); }
.subtitulo { font-size: 13px; color: var(--tinta-2); margin: 0 0 12px; }
.bloque { background: var(--superficie); border: 1px solid var(--linea); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
.nota { font-size: 11px; color: var(--tinta-2); }
.zona-mapa { position: relative; min-height: 0; }
.cargando { display: grid; place-items: center; height: 100%; color: var(--tinta-2); }
@media (max-width: 800px) {
  .app { grid-template-columns: 1fr; grid-template-rows: 55vh auto; height: auto; }
  .zona-mapa { order: -1; height: 55vh; }
  .panel { border-right: 0; overflow: visible; }
}
</style>
