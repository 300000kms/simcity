<template>
  <section class="tiempo">
    <div class="fecha">
      <strong>{{ fechaActual }}</strong>
      <span class="mandato">Mandato {{ mandato }} · trimestre {{ trimestreMandato }} de 16</span>
    </div>
    <div class="botones">
      <button class="primario" :disabled="store.running || !!store.finPartida" @click="avanzarTick">Avanzar trimestre</button>
      <button :disabled="!!store.finPartida" @click="store.running ? pausar() : reproducir()">
        {{ store.running ? 'Pausa' : 'Reproducir' }}
      </button>
      <select :value="store.speed" aria-label="Velocidad" @change="setVelocidad(Number($event.target.value))">
        <option :value="1">1×</option>
        <option :value="2">2×</option>
        <option :value="4">4×</option>
      </select>
      <button class="discreto" @click="reiniciar">Reiniciar</button>
    </div>
    <p v-if="store.finPartida" class="fin">{{ store.finPartida }}</p>
  </section>
</template>

<script>
import { store, avanzarTick, reproducir, pausar, setVelocidad, reiniciar, fecha } from '../store/simulation.js'

export default {
  name: 'TimeControls',
  data() {
    return { store }
  },
  computed: {
    fechaActual() {
      return fecha(this.store.tick)
    },
    mandato() {
      return Math.floor(this.store.tick / 16) + 1
    },
    trimestreMandato() {
      return (this.store.tick % 16) + 1
    }
  },
  methods: { avanzarTick, reproducir, pausar, setVelocidad, reiniciar }
}
</script>

<style scoped>
.fecha { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.fecha strong { font-size: 20px; }
.mandato { color: var(--tinta-2); font-size: 12px; }
.botones { display: flex; flex-wrap: wrap; gap: 6px; }
.fin { margin: 8px 0 0; padding: 8px; background: #fbe4e3; border-left: 3px solid #d03b3b; font-size: 13px; }
</style>
