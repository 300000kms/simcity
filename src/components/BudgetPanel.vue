<template>
  <section>
    <h2>Presupuesto anual</h2>
    <div v-for="p in partidas" :key="p.clave" class="partida">
      <label :for="'p-' + p.clave">
        <span>{{ p.nombre }}</span>
        <strong>{{ m(store.presupuesto[p.clave]) }}</strong>
      </label>
      <input
        :id="'p-' + p.clave"
        type="range"
        :min="rangos[p.clave][0]"
        :max="rangos[p.clave][1]"
        step="10"
        :value="store.presupuesto[p.clave]"
        @input="setPresupuesto(p.clave, Number($event.target.value))"
      />
      <small>{{ p.ayuda }}</small>
    </div>

    <h3>Último trimestre</h3>
    <table class="balance">
      <tbody>
        <tr><td>Impuestos (38)</td><td>{{ m(store.presupuesto.ingresosImpuestos) }}</td></tr>
        <tr><td>Transferencias</td><td>{{ m(store.presupuesto.ingresos - store.presupuesto.ingresosImpuestos) }}</td></tr>
        <tr><td>Gastos</td><td>−{{ m(store.presupuesto.gastos) }}</td></tr>
        <tr><td>Intereses de la deuda</td><td>−{{ m(store.presupuesto.intereses) }}</td></tr>
        <tr class="total">
          <td>Saldo</td>
          <td :class="store.presupuesto.saldo < 0 ? 'neg' : 'pos'">
            {{ store.presupuesto.saldo < 0 ? '▼' : '▲' }} {{ m(store.presupuesto.saldo) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="deuda">
      <div class="deuda-cifras">
        <span>Deuda</span>
        <strong>{{ m(store.presupuesto.deuda) }}</strong>
      </div>
      <div class="deuda-barra" role="meter" :aria-valuenow="store.presupuesto.deuda" aria-valuemin="0" :aria-valuemax="umbral">
        <div :style="{ width: pctDeuda + '%' }" :class="{ alerta: pctDeuda > 70 }"></div>
      </div>
      <small>Quiebra a partir de {{ m(umbral) }}</small>
    </div>
  </section>
</template>

<script>
import { config } from '../engine/config.js'
import { store, setPresupuesto } from '../store/simulation.js'

export default {
  name: 'BudgetPanel',
  data() {
    return {
      store,
      rangos: config.presupuesto.rangos,
      umbral: config.presupuesto.umbralQuiebra,
      partidas: [
        { clave: 'gastoCorriente', nombre: 'Gasto corriente', ayuda: 'Servicios y personal municipal.' },
        { clave: 'inversionCapital', nombre: 'Inversión de capital', ayuda: 'Llena el fondo con el que se construyen escuelas.' },
        { clave: 'financiacionEscuelas', nombre: 'Financiación escolar', ayuda: 'Gasto por alumno: sube la calidad escolar (19).' }
      ]
    }
  },
  computed: {
    pctDeuda() {
      return Math.min(100, (100 * (this.store.presupuesto.deuda || 0)) / this.umbral)
    }
  },
  methods: {
    setPresupuesto,
    m(v) {
      return `${Math.round(v || 0).toLocaleString('es-ES')} M€`
    }
  }
}
</script>

<style scoped>
.partida { margin-bottom: 10px; }
.partida label { display: flex; justify-content: space-between; font-size: 13px; }
.partida input { width: 100%; }
.partida small { color: var(--tinta-2); font-size: 11px; }
.balance { width: 100%; border-collapse: collapse; font-size: 13px; }
.balance td { padding: 2px 0; }
.balance td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
.balance .total td { border-top: 1px solid var(--linea); font-weight: 600; }
.neg { color: #b42f2f; }
.pos { color: #0a7a0a; }
.deuda { margin-top: 10px; font-size: 13px; }
.deuda-cifras { display: flex; justify-content: space-between; }
.deuda-barra { height: 8px; background: var(--linea); border-radius: 4px; overflow: hidden; margin: 4px 0; }
.deuda-barra div { height: 100%; background: var(--acento); border-radius: 4px; }
.deuda-barra div.alerta { background: #d03b3b; }
.deuda small { color: var(--tinta-2); font-size: 11px; }
</style>
