<template>
  <div class="mapa">
    <div ref="contenedor" class="mapa-lienzo"></div>
    <div v-if="hover" class="mapa-hover">{{ hover }}</div>
    <div class="mapa-leyenda">
      <label class="leyenda-titulo">
        <select :value="store.capa" @change="setCapa($event.target.value)">
          <option v-for="(c, clave) in capas" :key="clave" :value="clave">{{ c.nombre }}</option>
        </select>
      </label>
      <div class="leyenda-barra" :style="{ background: degradado }"></div>
      <div class="leyenda-extremos">
        <span>{{ capaActiva.formato(capaActiva.dominio[0]) }}</span>
        <span>{{ capaActiva.formato(capaActiva.dominio[1]) }}</span>
      </div>
      <div class="leyenda-escuela"><span class="punto"></span> Escuela <span class="punto pendiente"></span> En proyecto</div>
    </div>
  </div>
</template>

<script>
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import urlWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { config } from '../engine/config.js'
import { CAPAS, colorCapa, estiloBase, anadirCapas } from '../map/layers.js'
import { actualizarCeldas, actualizarEscuelas } from '../map/featureState.js'
import {
  store,
  getMundo,
  alCambiarMundo,
  setCapa,
  marcarEscuela,
  seleccionarCelda,
  nombreBarrio
} from '../store/simulation.js'

export default {
  name: 'MapView',
  props: {
    datos: { type: Object, required: true } // { malla, distritos, barrios, centros }
  },
  data() {
    return { store, hover: '', capas: CAPAS }
  },
  computed: {
    capaActiva() {
      return CAPAS[this.store.capa]
    },
    degradado() {
      return `linear-gradient(to right, ${this.capaActiva.rampa.join(', ')})`
    }
  },
  watch: {
    'store.capa'(capa) {
      if (!this.cargado) return
      this.map.setPaintProperty('celdas', 'fill-color', colorCapa(capa))
      actualizarCeldas(this.map, getMundo(), capa)
    },
    'store.seleccion'(sel, previa) {
      if (!this.cargado) return
      if (previa && (!sel || previa.id !== sel.id)) this.map.setFeatureState({ source: 'malla', id: previa.id }, { sel: false })
      if (sel) this.map.setFeatureState({ source: 'malla', id: sel.id }, { sel: true })
    },
    'store.modo'(modo) {
      if (this.map) this.map.getCanvas().style.cursor = modo === 'escuela' ? 'crosshair' : ''
    }
  },
  methods: {
    setCapa,
    refrescar(mundo) {
      if (!this.cargado || !mundo) return
      actualizarCeldas(this.map, mundo, this.store.capa)
      actualizarEscuelas(this.map, mundo, this.store.pendientes, this.datos.centros)
    },
    alClic(e) {
      const f = e.features && e.features[0]
      if (!f) return
      if (this.store.modo === 'escuela') marcarEscuela(f.id)
      else seleccionarCelda(f.id)
    },
    alMover(e) {
      const f = e.features && e.features[0]
      if (!f) return
      if (this.hoverId !== undefined && this.hoverId !== f.id) {
        this.map.setFeatureState({ source: 'malla', id: this.hoverId }, { hover: false })
      }
      this.hoverId = f.id
      this.map.setFeatureState({ source: 'malla', id: f.id }, { hover: true })
      const distrito = config.distritos.find((d) => d.id === f.properties.distrito)
      this.hover = `${nombreBarrio(f.properties.barrio)} · ${distrito.nombre}`
    },
    alSalir() {
      if (this.hoverId !== undefined) this.map.setFeatureState({ source: 'malla', id: this.hoverId }, { hover: false })
      this.hoverId = undefined
      this.hover = ''
    }
  },
  mounted() {
    // MapLibre 6 carga su worker desde un archivo aparte: Vite lo empaqueta y aquí se le indica la ruta
    maplibregl.setWorkerUrl(urlWorker)
    const [x0, y0, x1, y1] = config.mapa.bbox
    const m = config.mapa.margenBbox
    this.cargado = false
    this.map = new maplibregl.Map({
      container: this.$refs.contenedor,
      style: estiloBase(),
      center: config.mapa.centro,
      zoom: 11.6,
      minZoom: config.mapa.minZoom,
      maxZoom: config.mapa.maxZoom,
      maxBounds: [[x0 - m, y0 - m], [x1 + m, y1 + m]],
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: { compact: true }
    })
    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    this.map.on('load', () => {
      anadirCapas(this.map, this.datos, this.store.capa)
      this.map.fitBounds([[x0, y0], [x1, y1]], { padding: 20, duration: 0 })
      this.cargado = true
      this.refrescar(getMundo())
      this.map.on('click', 'celdas', this.alClic)
      this.map.on('mousemove', 'celdas', this.alMover)
      this.map.on('mouseleave', 'celdas', this.alSalir)
    })
    this.baja = alCambiarMundo((mundo) => this.refrescar(mundo))
  },
  beforeUnmount() {
    if (this.baja) this.baja()
    if (this.map) this.map.remove()
  }
}
</script>

<style scoped>
.mapa { position: relative; width: 100%; height: 100%; }
.mapa-lienzo { position: absolute; inset: 0; }
.mapa-hover {
  position: absolute; top: 10px; left: 10px; background: var(--superficie); color: var(--tinta);
  padding: 4px 8px; border-radius: 6px; font-size: 13px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15); pointer-events: none;
}
.mapa-leyenda {
  position: absolute; left: 10px; bottom: 28px; background: var(--superficie); padding: 8px 10px;
  border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15); font-size: 12px; width: 220px; max-width: calc(100% - 20px);
}
.leyenda-titulo select { width: 100%; font: inherit; font-weight: 600; padding: 2px; }
.leyenda-barra { height: 10px; border-radius: 3px; margin: 6px 0 2px; }
.leyenda-extremos { display: flex; justify-content: space-between; color: var(--tinta-2); }
.leyenda-escuela { margin-top: 6px; color: var(--tinta-2); display: flex; align-items: center; gap: 4px; }
.punto { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--escuela); border: 2px solid #fff; box-shadow: 0 0 0 1px var(--escuela); }
.punto.pendiente { background: #fff; border-color: var(--escuela); box-shadow: none; margin-left: 8px; }
</style>
