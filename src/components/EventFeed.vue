<template>
  <section>
    <h2>Eventos</h2>
    <p v-if="!store.eventos.length" class="vacio">Todavía no ha pasado nada. Avanza un trimestre.</p>
    <ul>
      <li v-for="(e, i) in store.eventos" :key="i" :class="e.tipo">
        <span class="cuando">{{ fecha(e.tick) }}</span> {{ e.texto }}
      </li>
    </ul>
  </section>
</template>

<script>
import { store } from '../store/simulation.js'

export default {
  name: 'EventFeed',
  data() {
    return { store }
  },
  methods: {
    // el evento ocurre durante el trimestre que acaba de cerrarse
    fecha(t) {
      const k = Math.max(0, t - 1)
      return `${2027 + Math.floor(k / 4)} T${(k % 4) + 1}`
    }
  }
}
</script>

<style scoped>
ul { list-style: none; padding: 0; margin: 0; font-size: 12px; max-height: 220px; overflow-y: auto; }
li { padding: 4px 0 4px 8px; border-left: 3px solid var(--linea); margin-bottom: 4px; }
li.escuelaNueva { border-color: var(--escuela); }
li.deficit, li.quiebra, li.escuelaRechazada, li.aviso { border-color: #d03b3b; }
li.superavit { border-color: #0ca30c; }
.cuando { color: var(--tinta-2); font-variant-numeric: tabular-nums; margin-right: 4px; }
.vacio { font-size: 12px; color: var(--tinta-2); margin: 0; }
</style>
