/* ============================================
   PULSO · CAPA DE APIs
   Conecta con DolarAPI, ArgentinaDatos, CoinGecko, data912
   Si fallan, usa datos demo realistas
   ============================================ */

const PulsoAPI = {

  // Datos demo de fallback (realistas, mayo 2026)
  fallback: {
    dolares: [
      { casa: 'oficial', nombre: 'Oficial', compra: 990, venta: 1012, fechaActualizacion: new Date().toISOString() },
      { casa: 'blue', nombre: 'Blue', compra: 1365, venta: 1385, fechaActualizacion: new Date().toISOString() },
      { casa: 'bolsa', nombre: 'MEP', compra: 1278, venta: 1298, fechaActualizacion: new Date().toISOString() },
      { casa: 'contadoconliqui', nombre: 'CCL', compra: 1320, venta: 1341, fechaActualizacion: new Date().toISOString() },
      { casa: 'tarjeta', nombre: 'Tarjeta', compra: 0, venta: 1620, fechaActualizacion: new Date().toISOString() },
      { casa: 'cripto', nombre: 'Cripto', compra: 1372, venta: 1392, fechaActualizacion: new Date().toISOString() }
    ],
    riesgoPais: { fecha: new Date().toISOString(), valor: 724 },
    inflacion: { fecha: '2026-04-01', valor: 2.4 },
    inflacionInteranual: { fecha: '2026-04-01', valor: 38.1 },
    btc: { current_price: 98420, price_change_percentage_24h: 2.1 },
    eth: { current_price: 3685, price_change_percentage_24h: 1.4 },
    uva: { fecha: new Date().toISOString(), valor: 1628.40 }
  },

  async getDolares() {
    try {
      const r = await fetch('https://dolarapi.com/v1/dolares', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      return { ok: true, data, source: 'live' };
    } catch (e) {
      console.warn('[Pulso] Fallback dólares:', e.message);
      return { ok: false, data: this.fallback.dolares, source: 'fallback' };
    }
  },

  async getRiesgoPais() {
    try {
      const r = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      return { ok: true, data, source: 'live' };
    } catch (e) {
      console.warn('[Pulso] Fallback riesgo:', e.message);
      return { ok: false, data: this.fallback.riesgoPais, source: 'fallback' };
    }
  },

  async getInflacion() {
    try {
      const r = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacion', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      const last = Array.isArray(data) ? data[data.length - 1] : data;
      return { ok: true, data: last, source: 'live' };
    } catch (e) {
      console.warn('[Pulso] Fallback inflación:', e.message);
      return { ok: false, data: this.fallback.inflacion, source: 'fallback' };
    }
  },

  async getInflacionInteranual() {
    try {
      const r = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacionInteranual', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      const last = Array.isArray(data) ? data[data.length - 1] : data;
      return { ok: true, data: last, source: 'live' };
    } catch (e) {
      console.warn('[Pulso] Fallback inflación interanual:', e.message);
      return { ok: false, data: this.fallback.inflacionInteranual, source: 'fallback' };
    }
  },

  async getUVA() {
    try {
      const r = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/uva', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      const last = Array.isArray(data) ? data[data.length - 1] : data;
      return { ok: true, data: last, source: 'live' };
    } catch (e) {
      console.warn('[Pulso] Fallback UVA:', e.message);
      return { ok: false, data: this.fallback.uva, source: 'fallback' };
    }
  },

  async getCryptos() {
    try {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      return {
        ok: true,
        source: 'live',
        data: {
          btc: { current_price: data.bitcoin?.usd, price_change_percentage_24h: data.bitcoin?.usd_24h_change },
          eth: { current_price: data.ethereum?.usd, price_change_percentage_24h: data.ethereum?.usd_24h_change }
        }
      };
    } catch (e) {
      console.warn('[Pulso] Fallback cripto:', e.message);
      return { ok: false, source: 'fallback', data: { btc: this.fallback.btc, eth: this.fallback.eth } };
    }
  },

  // ============= CEDEARS - DATOS REALES =============
  // Cascada de fuentes en orden de calidad:
  //   1. BYMA Open Data (oficial, delay 1-5min) - via proxy /api/byma
  //   2. data912 directo (delay ~2hs) - fallback si proxy falla
  async getCedears() {
    // Primero intentamos nuestro proxy a BYMA
    try {
      const r = await fetch('/api/byma?type=cedears', { signal: AbortSignal.timeout(15000) });
      if (r.ok) {
        const json = await r.json();
        if (json.ok && json.data) {
          console.log(`✓ CEDEARs de ${json.source} (${json.count} items) - ${json.delayInfo}`);
          return {
            ok: true,
            data: json.data,
            source: json.source.toLowerCase(),
            delayInfo: json.delayInfo,
            count: json.count
          };
        }
      }
    } catch (e) {
      console.warn('[Pulso] Proxy BYMA falló:', e.message);
    }

    // Fallback final: data912 directo (sin proxy, funciona en cualquier entorno)
    try {
      const r = await fetch('https://data912.com/live/arg_cedears', { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error('data912 error ' + r.status);
      const arr = await r.json();
      if (!Array.isArray(arr) || arr.length === 0) throw new Error('Sin datos');
      const byTicker = {};
      arr.forEach(item => { if (item.symbol) byTicker[item.symbol.toUpperCase()] = item; });
      return {
        ok: true,
        data: byTicker,
        source: 'data912',
        delayInfo: 'Delay ~2 horas',
        count: arr.length
      };
    } catch (e) {
      console.warn('[Pulso] CEDEARs no disponibles:', e.message);
      return { ok: false, data: {}, source: 'fallback', delayInfo: null };
    }
  },

  // ============= STOCKS USA (data912) =============
  async getUSStocks() {
    try {
      const r = await fetch('https://data912.com/live/usa_stocks', { signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error('data912 error ' + r.status);
      const arr = await r.json();
      if (!Array.isArray(arr)) throw new Error('Sin datos');
      const byTicker = {};
      arr.forEach(item => { if (item.symbol) byTicker[item.symbol.toUpperCase()] = item; });
      return { ok: true, data: byTicker, source: 'live' };
    } catch (e) {
      console.warn('[Pulso] USA stocks no disponibles:', e.message);
      return { ok: false, data: {}, source: 'fallback' };
    }
  },

  async loadAll() {
    const [dolares, riesgo, inflacion, inflacionIA, uva, cryptos, cedears, usStocks, indices, riesgoHist] = await Promise.all([
      this.getDolares(),
      this.getRiesgoPais(),
      this.getInflacion(),
      this.getInflacionInteranual(),
      this.getUVA(),
      this.getCryptos(),
      this.getCedears(),
      this.getUSStocks(),
      this.getIndices(),
      this.getRiesgoPaisHistorico()
    ]);
    return { dolares, riesgo, inflacion, inflacionIA, uva, cryptos, cedears, usStocks, indices, riesgoHist };
  },

  // ============= ÍNDICES BURSÁTILES =============
  // Merval: data912.com (misma fuente que CEDEARs, CORS abierto).
  // Nasdaq / S&P 500: Yahoo Finance.
  async getMerval() {
    try {
      const r = await fetch('https://data912.com/live/arg_indices', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('data912 error ' + r.status);
      const arr = await r.json();
      if (!Array.isArray(arr)) throw new Error('Formato inesperado');
      const merv = arr.find(i => i.symbol === 'MERVAL' || i.symbol === '^MERV' || (i.symbol || '').toUpperCase().includes('MERV'));
      if (!merv?.c) throw new Error('Sin dato Merval');
      const price = merv.c;
      const prev = merv.pc ?? merv.prev_close ?? null;
      return {
        ok: true, source: 'data912',
        data: { symbol: '^MERV', price, changePercent: prev ? ((price - prev) / prev) * 100 : (merv.v_pct ?? null), currency: 'ARS' }
      };
    } catch (e) {
      console.warn('[Pulso] Merval no disponible:', e.message);
      return { ok: false, source: 'fallback', data: { symbol: '^MERV', price: null, changePercent: null } };
    }
  },

  async getIndice(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('Yahoo error ' + r.status);
      const data = await r.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error('Sin datos');

      const meta = result.meta;
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose;
      const chgPct = prevClose ? ((price - prevClose) / prevClose) * 100 : null;

      return {
        ok: true,
        source: 'live',
        data: {
          symbol,
          price,
          previousClose: prevClose,
          changePercent: chgPct,
          currency: meta.currency,
          marketState: meta.marketState
        }
      };
    } catch (e) {
      console.warn('[Pulso] Índice ' + symbol + ' no disponible:', e.message);
      return { ok: false, source: 'fallback', data: { symbol, price: null, changePercent: null } };
    }
  },

  async getIndices() {
    const [merval, nasdaq, sp500] = await Promise.all([
      this.getMerval(),
      this.getIndice('%5ENDX'),
      this.getIndice('%5EGSPC')
    ]);
    return { merval: merval.data, nasdaq: nasdaq.data, sp500: sp500.data };
  },

  // ============= HISTÓRICO DE RIESGO PAÍS =============
  async getRiesgoPaisHistorico() {
    try {
      const r = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais', { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error('API error');
      const data = await r.json();
      if (!Array.isArray(data) || data.length < 2) return { ok: false };
      return { ok: true, data: data.slice(-2) };
    } catch (e) {
      return { ok: false };
    }
  },

  // ============= BÚSQUEDA DE PRODUCTOS EN SUPERMERCADOS =============
  // Usa nuestro proxy /api/precios que consulta los 5 supers en paralelo.
  // Funciona en producción (Vercel) o local con `vercel dev`.

  // En desarrollo local sin proxy, devuelve resultados demo claramente marcados
  async buscarProductos(query) {
    if (!query || query.trim().length < 2) {
      return { ok: false, error: 'Escribí al menos 2 letras', resultados: [] };
    }

    try {
      const url = `/api/precios?q=${encodeURIComponent(query.trim())}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });

      if (!r.ok) throw new Error('Proxy error ' + r.status);

      const data = await r.json();
      return { ok: true, source: 'live', ...data };
    } catch (e) {
      console.warn('[Pulso] Búsqueda fallida:', e.message);
      return {
        ok: false,
        source: 'error',
        error: 'No pudimos buscar precios. El proxy no está disponible (¿estás corriendo la app sin Vercel?)',
        resultados: []
      };
    }
  },

  // Obtener precios de un producto específico por EAN en los 5 supers
  // Útil para la tabla comparativa del changuito (precios exactos del mismo producto)
  async obtenerPreciosPorEAN(ean) {
    if (!ean) return { ok: false, resultados: [] };

    try {
      const url = `/api/precios?ean=${encodeURIComponent(ean)}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error('Proxy error ' + r.status);
      const data = await r.json();
      return { ok: true, source: 'live', ...data };
    } catch (e) {
      console.warn('[Pulso] EAN lookup fallido:', e.message);
      return { ok: false, source: 'error', resultados: [] };
    }
  },

  // Obtener precios de varios EANs a la vez (en paralelo)
  // Usado para refrescar la tabla del changuito del usuario
  async obtenerPreciosBatch(eans) {
    if (!Array.isArray(eans) || eans.length === 0) return [];
    const promesas = eans.map(ean => this.obtenerPreciosPorEAN(ean));
    return Promise.all(promesas);
  }
};

window.PulsoAPI = PulsoAPI;
