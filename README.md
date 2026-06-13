# Pulso · Tu tablero de mando argentino

App de finanzas argentinas: dólar, inflación, changuito con precios reales en 5 supermercados, CEDEARs en tiempo real y seguimiento de gastos con "Tiempo de Vida".

## Estructura del proyecto

```
pulso/
├── index.html          # HTML principal (PWA mobile-first)
├── manifest.json       # Manifest PWA
├── css/
│   └── styles.css      # Estilos (paleta editorial, dark cards, animaciones)
├── js/
│   ├── data.js         # PulsoData — catálogo de CEDEARs, submenús, headlines
│   ├── api.js          # PulsoAPI — DolarAPI, ArgentinaDatos, CoinGecko, data912, Yahoo Finance
│   ├── storage.js      # PulsoStore — persistencia en localStorage
│   ├── ui.js           # PulsoUI — helpers de formato, modal, toast, score
│   └── app.js          # Pulso — lógica principal y renders
└── zelena-voda-pasaporte/   # Sub-proyecto separado (app de pasaportes, React+Vite)
```

## Deploy

La app es 100% estática salvo los proxies de precios y BYMA. Para funcionalidad completa:

- **Vercel (recomendado)**: drag & drop del directorio. Los proxies `/api/precios` y `/api/byma` funcionan automáticamente.
- **Abrir localmente**: abrí `index.html` directamente. El changuito de búsqueda no funcionará (necesita el proxy), pero todos los demás datos (dólar, inflación, CEDEARs, gastos) sí.

## Fuentes de datos

| Dato | Fuente | Latencia |
|---|---|---|
| Dólar (blue, MEP, CCL...) | DolarAPI | ~segundos |
| Inflación / Riesgo país / UVA | ArgentinaDatos | ~segundos |
| Bitcoin / Ethereum | CoinGecko | ~segundos |
| CEDEARs | BYMA Open Data (via proxy) → data912 (fallback) | 1-5 min / ~2 hs |
| Merval / Nasdaq / S&P 500 | Yahoo Finance | ~segundos |
| Precios supermercados | Proxy Vercel (Día, Carrefour, Disco, Jumbo, Vea) | ~segundos |

## Módulos JS

- **PulsoData** — datos estáticos: catálogo de productos, CEDEARs metadata, submenús de gastos, headlines
- **PulsoAPI** — todas las llamadas a APIs externas, con fallback demo si fallan
- **PulsoStore** — `localStorage` con keys versionadas; gastos, ingresos, valor hora, streak, CEDEARs favoritos
- **PulsoUI** — `fmt()`, `fmtPct()`, `calcPulso()`, `toast()`, `showModal()`, `montoATiempo()`, etc.
- **Pulso** — objeto principal: `init()`, renders por sección, modales de gastos, changuito, valor hora
