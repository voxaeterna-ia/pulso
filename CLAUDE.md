# Pulso · Reglas para Claude Code

## Qué es este proyecto
App de finanzas argentinas (PWA mobile-first). Muestra dólar, inflación, CEDEARs en tiempo real, y permite rastrear gastos personales con un feature llamado "Tiempo de Vida" (gastos expresados en horas de trabajo). También tiene un "Changuito" que compara precios de supermercados usando datos oficiales del gobierno.

## Stack
- **Frontend**: HTML + CSS + JS vanilla (sin frameworks). Archivos en `css/` y `js/`.
- **Backend**: Node.js + Express (`server.js`). Requiere disco persistente — **no es compatible con Vercel/serverless**.
- **Base de datos**: SQLite (`sepa.db`, ~600 MB–1.2 GB). Nunca va al repo.
- **Deploy**: VPS con PM2 + nginx.

## Estructura de archivos
```
index.html          HTML principal
css/styles.css      Estilos
js/data.js          PulsoData — catálogo estático (CEDEARs, submenús, headlines)
js/api.js           PulsoAPI — llamadas a APIs externas con fallback demo
js/storage.js       PulsoStore — persistencia localStorage
js/ui.js            PulsoUI — helpers de formato, modal, toast, score
js/app.js           Pulso — lógica principal y renders
server.js           Express server
api/precios.js      GET /api/precios?q= o ?ean= → consulta sepa.db
api/admin.js        POST /api/admin/upload, /process, GET /status, /progress (SSE)
api/byma.js         GET /api/byma?type=cedears → proxy a BYMA Open Data
admin/index.html    Panel admin (upload ZIP SEPA, progreso de ingesta)
scripts/ingestar-sepa.js  Procesa ZIP SEPA → SQLite
manifest.json       PWA manifest
.env                Configuración local (NO va al repo)
.env.example        Plantilla del .env
```

## Arquitectura del Changuito — REGLAS CRÍTICAS
El changuito usa datos oficiales del **SEPA** (Secretaría de Comercio):
- URL fuente: https://datos.produccion.gob.ar/dataset/sepa-precios
- ZIP diario de ~330 MB con sub-ZIPs por cadena, CSVs con separador pipe `|` y BOM UTF-8
- **Miguel descarga el ZIP manualmente** (no hay cron automático)
- Lo sube vía el panel admin en `/admin` con clave definida en `ADMIN_PASSWORD`
- `scripts/ingestar-sepa.js` lo procesa y genera `sepa.db` con swap atómico
- `api/precios.js` consulta `sepa.db` para responder búsquedas

**NO hacer nunca:**
- ❌ Scraping de supermercados (bloquean con 403)
- ❌ Cron automático para descargar SEPA
- ❌ APIs externas para precios de productos
- ❌ Commitear `sepa.db` (está en .gitignore, pesa 600 MB+)
- ❌ Deploy en Vercel/Lambda/serverless (necesita disco persistente para sepa.db)

## Variables de entorno (.env)
```
ADMIN_PASSWORD=celaya2026   # clave del panel admin
PORT=3000
```

## Arrancar el servidor
```bash
npm install
node server.js        # producción
node --watch server.js  # desarrollo (auto-restart)
```

## APIs externas que usa el frontend
| Dato | URL | Fallback si falla |
|---|---|---|
| Dólar | dolarapi.com/v1/dolares | datos demo hardcodeados |
| Inflación / Riesgo país / UVA | api.argentinadatos.com | datos demo |
| Bitcoin / Ethereum | api.coingecko.com | datos demo |
| CEDEARs | /api/byma (proxy nuestro → BYMA Open Data) → data912.com (fallback directo) | sin datos |
| Merval / Nasdaq / S&P500 | query1.finance.yahoo.com | sin datos |
| Precios supermercados | /api/precios (consulta sepa.db local) | error si no hay sepa.db |

## Módulos JS (orden de carga en index.html)
1. `PulsoData` — datos estáticos, sin dependencias
2. `PulsoAPI` — llama a APIs externas, expone `loadAll()` y `buscarProductos()`
3. `PulsoStore` — localStorage, expone getters/setters por entidad
4. `PulsoUI` — helpers puros: `fmt()`, `fmtPct()`, `calcPulso()`, `toast()`, `showModal()`, `closeModal()`, `pillFor()`, `montoATiempo()`
5. `Pulso` — objeto principal, llama a todos los anteriores

## Bugs conocidos / pendientes
- `blueChg` hardcodeado en `0.7` en `renderPulsoDelDia()` (js/app.js) — debería venir del histórico
- Los porcentajes de votos comunitarios en el home son estáticos (28%, 45%, 27%)
- El texto "Precios consultados en vivo · cache 1 hora" en la comparativa del changuito es incorrecto — ahora es SEPA (actualización manual)
- Las alertas de CEDEARs (AAPL > $9.200, TSLA < $5.800, NVDA ±5%) son decorativas, no tienen lógica real

## Sub-proyecto zelena-voda-pasaporte/
App React+Vite+Firebase separada (app de descuentos/pasaportes). Vive en este repo pero es completamente independiente. No modificar a menos que Miguel lo pida explícitamente.
