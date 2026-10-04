# Simulador urbano tipo SimCity

## Objetivo
Simulador de política urbana basado en el esquema de `docs/esquema.jpg`: un modelo de sistemas con 5 actores, 2 entornos y un nodo central (presupuesto urbano), unidos por flujos numerados (enlaces 9 a 40). El jugador gestiona el presupuesto y observa cómo reaccionan los actores y el territorio.

## Estado actual
- Fase 1 (motor mínimo) hecha: `nodes.json`, `links.json`, `config.js`, `rng.js`, `world.js`, sistemas de presupuesto, economía y territorio, `tick.js` con los flujos 38, 23 y 24, y tests.
- `npm test` corre los tests. `npm run sim -- 16` corre la simulación en consola.
- **`docs/esquema.jpg` no está en el repositorio.** Los orígenes y destinos de `links.json` están inferidos del texto de la leyenda y marcados con `verificado: false`. Hay que contrastarlos con el esquema antes de implementar los actores (fase 3).
- Datos de Barcelona: CartoBCN vía espejo en GitHub (ver `src/data/barcelona/README.md`). Open Data BCN no es accesible desde el entorno de desarrollo.

## Visión del juego

### Qué es
Un simulador de **política urbana y presupuesto municipal** de Barcelona. No es un constructor de edificios como SimCity: el jugador no coloca casas ni carreteras una a una. Decide **dinero y normas**, y la ciudad cambia como consecuencia de cómo reaccionan actores con intereses distintos. La ciudad es el resultado de una negociación permanente entre políticos, planners, educadores, promotores y electores, con el presupuesto urbano en el centro.

### Rol del jugador
El jugador es el **alcalde** (el actor político, nodo 5). Decide el presupuesto anual, la zonificación y la ubicación de escuelas e inversiones. Los otros actores y los electores los controla la simulación: son agentes con objetivos propios que presionan, ofrecen apoyo o retiran el apoyo según lo que el jugador haga.

### Bucle de juego (un tick es un trimestre)
1. **Entran ingresos** por impuestos y bonos, según la base fiscal de la ciudad (38).
2. **Los planners preparan un proyecto de inversión** con informes técnicos y recomendaciones (26, 11).
3. **Los actores presionan.** Electores piden servicios por distrito (16), educadores piden más presupuesto escolar (20), promotores piden rezonificaciones y ofrecen contribuciones (9, 32).
4. **El jugador decide.** Reparte el presupuesto entre gasto corriente, inversión de capital y financiación escolar, aprueba o rechaza propuestas, zonifica celdas y ubica escuelas.
5. **La ciudad reacciona.** Cambian el valor del suelo, la población, los niños en edad escolar y la inversión privada (23, 24, 33 a 37).
6. **Informe del trimestre:** cambios en indicadores, eventos y consecuencias. Cada 16 ticks (un mandato de 4 años) hay elecciones.

### Qué quiere cada actor

| Actor | Quiere | Ofrece | Pide |
|---|---|---|---|
| Políticos (5) | Prestigio, influencia, crecimiento urbano | Decisiones sobre presupuesto y zoning, favores | Apoyo político y propuestas |
| Planners (6) | Administración eficiente, prestigio profesional | Información técnica, proyecciones, borrador de presupuesto | Que se sigan sus recomendaciones |
| Educadores (7) | Alta calidad de servicios escolares | Apoyo político, información | Más presupuesto y escuelas bien ubicadas |
| Promotores (8) | Beneficio personal | Contribuciones de campaña, inversión, actividad económica | Rezonificación, localización favorable de equipamientos |
| Electores (2) | Servicios y calidad de vida en su barrio | Votos y apoyo | Servicios, equipamiento, escuelas |

### Qué ve el jugador
- **Mapa de Barcelona** con capas conmutables: valor del suelo, usos, población, calidad escolar, satisfacción por distrito.
- **Panel de presupuesto** con sliders y el balance de ingresos y gastos.
- **Tarjetas de actores** con su nivel de satisfacción y de apoyo al alcalde.
- **Feed de eventos** con las presiones y ofertas de cada trimestre.
- **Gráficos** de series temporales (deuda, población, valor del suelo, apoyo electoral).

### Dilemas de ejemplo
- Un promotor ofrece una donación a cambio de rezonificar un solar en el Poblenou. Aceptar da dinero y crecimiento, pero los electores del barrio pierden satisfacción y el planner advierte de que sobrecarga los servicios.
- Subir la financiación escolar en un distrito mejora la calidad educativa y atrae familias, pero reduce la inversión de capital disponible y presiona la deuda.
- Una escuela nueva sube el valor del suelo a su alrededor, lo que beneficia a promotores pero encarece la vivienda para los electores.

### Cómo se gana y se pierde
Sandbox de gestión por mandatos, sin victoria única. Puntuación multiobjetivo: apoyo electoral, equilibrio presupuestario, crecimiento, calidad escolar y prestigio. Se pierde si:
- Se pierden las elecciones.
- La deuda supera un umbral de quiebra.
- Los apoyos de los actores clave caen por debajo de un mínimo y bloquean el gobierno.

### Mecánica oculta (enlace 40)
El enlace "no oficial" se implementa como una capa de favores y lobby. El jugador puede aceptar o pedir favores fuera del presupuesto oficial para obtener ventajas, con riesgo creciente de escándalo que afecta a prestigio y apoyo electoral.

### Alcance de la primera versión (MVP)
Incluido: presupuesto, impuestos, escuelas, valor del suelo, promotores y electores por distrito, elecciones.
Fuera por ahora: transporte, vivienda social, medio ambiente, eventos externos (crisis, pandemias), multijugador.

### Decisiones abiertas (confirmar con el autor antes de implementar)
- Si el jugador es el alcalde o prefiere otro rol, o un modo observador sin intervención.
- Duración de la partida (número de mandatos).
- Nivel de realismo de los datos iniciales por barrio.

## Ámbito geográfico
Solo el municipio de Barcelona.
- Centro `[2.1734, 41.3851]` (lng, lat). Bbox verificado contra el límite oficial: `[2.0523, 41.3170, 2.2280, 41.4683]`.
- El mapa se restringe con `maxBounds` (bbox con margen), `minZoom` y `maxZoom`. El jugador no puede salir de Barcelona.
- La malla (`src/map/grid.js`, Turf) se recorta con el límite municipal: sin celdas en el mar ni fuera del término. Celda de 250 m, unas 2300 celdas, en `config.malla`.
- Cada celda guarda su barrio y su distrito. Los 10 distritos y 73 barrios son la unidad territorial de electores e informes.
- Los GeoJSON viven en `src/data/barcelona/`. La app no depende de internet para ellos.
- Los valores iniciales por distrito son aproximaciones plausibles en `config.js`, a refinar con Open Data BCN.

## Stack
- JavaScript (ES modules), Vue 3 con **Options API**. No usar Composition API ni `<script setup>`.
- Sin Pinia. Estado compartido en un store propio creado con `reactive()`.
- Vite, MapLibre GL JS, Turf.js, Vitest.
- Sin TypeScript. JSDoc en las funciones públicas del motor.

## Regla de oro de arquitectura
Tres capas separadas. Nunca mezclarlas.
1. **Motor** (`src/engine`): JS puro. No importa Vue ni MapLibre. Se ejecuta en Node y es testeable en consola.
2. **Store** (`src/store`): objeto `reactive()` con el estado y funciones de acción. Única vía por la que la vista toca el motor.
3. **Vista** (`src/components`, `src/map`): Vue y MapLibre. Solo pinta y envía acciones. `src/map/grid.js` solo usa Turf para que los tests y scripts de Node puedan generar la malla.

## Estructura de carpetas
```
docs/esquema.jpg             # esquema original (fuente de verdad del modelo) PENDIENTE
scripts/
  prepare-barcelona.js       # genera los GeoJSON limpios desde los originales
  sim.js                     # simulación en consola
src/
  data/barcelona/            # limite, distritos, barrios (+ originales *_raw)
  engine/
    config.js                # todos los parámetros y pesos
    rng.js                   # generador con semilla
    world.js                 # estado del mundo, creación inicial, indicadores
    graph/nodes.json, links.json
    actors/                  # politicos, planners, educadores, promotores, electores (fase 3)
    systems/
      economia.js            # nodo 4
      territorio.js          # nodo 3
      presupuesto.js         # nodo 1
    tick.js
  store/simulation.js        # fase 2/4
  map/grid.js, layers.js, featureState.js
  components/                # fase 4
tests/
```

## Modelo del esquema

### Nodos
1 presupuesto, 2 electores, 3 territorio, 4 economia, 5 politicos, 6 planners, 7 educadores, 8 promotores (claves en `nodes.json`).

### Enlaces
Ver `src/engine/graph/links.json`. Forma:
```js
{ id: 13, from: 'politicos', to: 'presupuesto', type: 'decision', label: 'Decide presupuesto anual', verificado: false }
```
Tipos: `dinero` (38, 39, 9), `informacion` (11, 12, 18, 29, 31, y 17), `apoyo` (14, 15, 22, 30, 32, y 25), `demanda` (16, 19, 20, 21, 35), `decision` (10, 13, 26), `mercado` (33, 34, 36, 37), `efecto` (23, 24, 27, 28), `oculto` (40). Los tipos de 17, 23, 24, 25, 27, 28 y 40 no venían en la especificación y son propuestos.
Los orígenes y destinos deben leerse de las flechas de `docs/esquema.jpg`. Si una flecha es ambigua, preguntar antes de asumir.

## Estado del mundo
- `presupuesto`: partidas anuales (`gastoCorriente`, `inversionCapital`, `financiacionEscuelas`), `ingresos`, `gastos`, `saldo`, `deuda`, `remanente`, `fondoInversion`, `baseFiscal`.
- `celdas[]`: `valorSuelo`, `uso`, `densidad`, `calidadEscuela`, `accesoEscuela`, `servicios`, `escuelas`, `poblacion`, `ninosEscolares`, `rentaMedia`, más referencias iniciales.
- `indicadores` y `distritos[]`: agregados para la interfaz.
- `rngEstado`: estado del generador, para reanudar la partida exactamente.
- Unidades: dinero en M€, suelo en €/m² construido, tiempo en trimestres.

## Orden de un tick (un trimestre)
1. Economía genera base fiscal según valor del suelo (38).
2. Planners preparan presupuesto de capital con datos del territorio (26, 11).
3. Los actores presionan: electores (16, 21), educadores (19, 20), promotores (9, 32).
4. Políticos reparten el presupuesto maximizando una utilidad ponderada (13, 10).
5. Se ejecuta el gasto: aparecen escuelas e infraestructuras en celdas concretas.
6. Efectos: servicios y escuelas cambian el valor del suelo (24, 39), promotores invierten (34, 36, 35), cambia población y niños en edad escolar (23).
7. Se actualiza la satisfacción. Cada N ticks hay elecciones.

## Mapa
- Vista fija en Barcelona. Basemap discreto en tonos neutros, proveedor gratuito sin clave si es posible.
- Contornos de distritos y barrios como capas de línea, con etiquetas al pasar el ratón.
- Malla en una sola fuente GeoJSON. Actualizar con `setFeatureState`, nunca `setData` por tick.
- Capas conmutables: valor del suelo, uso, población, calidad escolar, satisfacción. `fill-extrusion` según densidad.
- Clic en celda: zonificar, colocar escuela o inversión.

## Store reactivo
- Los componentes nunca modifican `store.world` directamente, solo mediante funciones de acción.
- Las celdas se guardan con `shallowReactive` o `markRaw` y se reemplazan enteras tras cada tick. Presupuesto, indicadores e historial sí son reactivos.
- El mapa no observa el store con watchers profundos. Tras cada tick, `map/featureState.js` recibe el mundo y actualiza los `feature-state`.

## Convenciones de código
- Componentes Vue en Options API, secciones en orden: `name`, `props`, `data`, `computed`, `watch`, `methods`, hooks.
- Parámetros solo en `engine/config.js`.
- Toda aleatoriedad pasa por `rng.js` con semilla. Misma semilla, misma partida.
- Funciones del motor puras: reciben estado y devuelven estado nuevo. Nunca mutan la entrada (hay tests que lo comprueban).
- Cada actor exporta `decide(world, config, rng)` y devuelve acciones.
- Cada sistema exporta `step(world, config)` y devuelve `{ mundo, eventos }`.
- Cada regla del motor lleva un comentario con el número de enlace, por ejemplo `// enlace 24`.
- Tests con Vitest para cada actor y sistema. Test de integración de 40 ticks con semilla fija.
- Comentarios y textos de interfaz en español.
- Commits pequeños, uno por funcionalidad.

## Fases
1. **Motor mínimo** (hecha): grafo, presupuesto, impuestos, un tick, tests.
2. **Mapa:** vista restringida a Barcelona, malla recortada, capa de valor del suelo y clic en celdas.
3. **Actores:** promotores y economía, luego educadores, planners, electores y políticos.
4. **Interfaz:** panel de presupuesto, indicadores por actor, gráficos, feed de eventos, velocidad, elecciones.
5. **Después:** calibración, escenarios, guardado de partida, Web Worker para el motor.
