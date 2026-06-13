/* ============================================
   PULSO · PROXY BYMA (CEDEARs)
   GET /api/byma?type=cedears
   Redirige a BYMA Open Data (evita CORS desde el browser)
   Cachea 5 minutos en memoria para no sobrecargar BYMA
   ============================================ */

const express = require('express');
const router = express.Router();
const https = require('https');

const BYMA_URL        = 'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/cedears';
const BYMA_INDICES_URL = 'https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free/leading-indices';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

let cache        = { data: null, ts: 0 };
let cacheIndices = { data: null, ts: 0 };

function fetchByma() {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Pulso/2.3 (finanzas argentinas)'
      }
    };
    https.get(BYMA_URL, options, res => {
      if (res.statusCode !== 200) {
        reject(new Error('BYMA status ' + res.statusCode));
        return;
      }
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('JSON inválido de BYMA')); }
      });
    }).on('error', reject);
  });
}

router.get('/', async (req, res) => {
  if (!['cedears', 'indices'].includes(req.query.type)) {
    return res.status(400).json({ ok: false, error: 'type=cedears o type=indices requerido' });
  }

  // ── ÍNDICES (Merval, etc.) ──
  if (req.query.type === 'indices') {
    if (cacheIndices.data && Date.now() - cacheIndices.ts < CACHE_TTL) {
      return res.json({ ok: true, source: 'byma', ...cacheIndices.data });
    }
    try {
      const data = await new Promise((resolve, reject) => {
        https.get(BYMA_INDICES_URL, { headers: { 'Accept': 'application/json', 'User-Agent': 'Pulso/2.3' } }, r => {
          if (r.statusCode !== 200) { reject(new Error('BYMA status ' + r.statusCode)); return; }
          let body = '';
          r.on('data', c => { body += c; });
          r.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
        }).on('error', reject);
      });
      const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      const merval = arr.find(i => (i.symbol || i.descripcion || '').toUpperCase().includes('MERV') || (i.descripcion || '').toUpperCase().includes('MERVAL'));
      const result = {
        merval: merval ? {
          price: merval.last ?? merval.closePrice ?? merval.value ?? null,
          changePercent: merval.changePercent ?? merval.variation ?? null
        } : null
      };
      cacheIndices = { data: { indices: result }, ts: Date.now() };
      return res.json({ ok: true, source: 'byma', indices: result });
    } catch (e) {
      console.warn('[byma] Índices no disponibles:', e.message);
      return res.status(502).json({ ok: false, error: 'Índices no disponibles: ' + e.message });
    }
  }

  // ── CEDEARs ──

  // Servir desde caché si está fresco
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
    return res.json({ ok: true, source: 'byma', ...cache.data });
  }

  try {
    const raw = await fetchByma();

    // BYMA devuelve { data: [...] } con campos: symbol, last, bid, ask, change, changePercent, volume
    // Normalizamos a { data: { TICKER: { c, bid, ask, v, v_pct } }, count, delayInfo }
    const arr = Array.isArray(raw?.data) ? raw.data : [];
    const byTicker = {};
    arr.forEach(item => {
      if (!item.symbol) return;
      byTicker[item.symbol.toUpperCase()] = {
        c:     item.last ?? item.closePrice ?? null,
        bid:   item.bidPrice ?? item.bid ?? null,
        ask:   item.offerPrice ?? item.ask ?? null,
        v:     item.nominalVolume ?? item.volume ?? null,
        v_pct: item.changePercent ?? item.variation ?? null
      };
    });

    cache = { data: { data: byTicker, count: arr.length, delayInfo: 'delay 1-5 min' }, ts: Date.now() };
    res.json({ ok: true, source: 'byma', ...cache.data });

  } catch (e) {
    console.warn('[byma] Error conectando con BYMA:', e.message);
    res.status(502).json({ ok: false, error: 'BYMA no disponible: ' + e.message });
  }
});

module.exports = router;
