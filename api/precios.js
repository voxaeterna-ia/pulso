/* ============================================
   PULSO · API DE PRECIOS (SEPA)
   GET /api/precios?q=leche       búsqueda por nombre
   GET /api/precios?ean=779400001 búsqueda por EAN
   Consulta sepa.db (SQLite local, generado por scripts/ingestar-sepa.js)
   ============================================ */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'sepa.db');

// Nombres display para cadenas conocidas (se completa con cualquier cadena que esté en la DB)
const CADENAS_DISPLAY = {
  dia:       'Día',
  carrefour: 'Carrefour',
  disco:     'Disco',
  jumbo:     'Jumbo',
  vea:       'Vea',
  coto:      'Coto',
  walmart:   'Walmart',
  toledo:    'Toledo',
  makro:     'Makro',
};

function getDb() {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    const Database = require('better-sqlite3');
    return new Database(DB_PATH, { readonly: true });
  } catch (e) {
    console.error('[precios] No se pudo abrir sepa.db:', e.message);
    return null;
  }
}

router.get('/', (req, res) => {
  const { q, ean } = req.query;

  if (!q && !ean) {
    return res.json({ ok: false, error: 'Falta parámetro q= o ean=' });
  }

  const db = getDb();
  if (!db) {
    return res.json({
      ok: false,
      error: 'Base de datos SEPA no disponible. Subí un ZIP desde el panel admin.',
      resultados: []
    });
  }

  try {
    let rows;

    if (ean) {
      rows = db.prepare(
        'SELECT ean, nombre, marca, cadena, precio FROM productos WHERE ean = ? ORDER BY cadena'
      ).all(ean.trim());
    } else {
      const termino = '%' + q.trim().toLowerCase() + '%';
      rows = db.prepare(
        `SELECT ean, nombre, marca, cadena, precio
         FROM productos
         WHERE nombre_lower LIKE ?
         ORDER BY nombre_lower, cadena
         LIMIT 200`
      ).all(termino);
    }

    db.close();

    // Agrupar por cadena — usa las cadenas que realmente tienen resultados
    const cadenasEnRows = [...new Set(rows.map(r => r.cadena))];

    // Si no hay resultados, devolvemos igual las cadenas conocidas vacías
    const cadenasAMostrar = cadenasEnRows.length > 0
      ? cadenasEnRows
      : Object.keys(CADENAS_DISPLAY);

    const resultados = cadenasAMostrar.map(key => {
      const prods = rows
        .filter(r => r.cadena === key)
        .slice(0, 30)
        .map(r => ({
          ean: r.ean || null,
          id: r.ean || r.nombre,
          nombre: r.nombre,
          marca: r.marca || '',
          imagen: null,
          precio: r.precio,
          disponible: true
        }));

      return {
        super: key,
        supermercado: CADENAS_DISPLAY[key] || key.charAt(0).toUpperCase() + key.slice(1),
        ok: true,
        productos: prods
      };
    });

    res.json({ ok: true, resultados });

  } catch (e) {
    console.error('[precios] Error consultando DB:', e.message);
    if (db) try { db.close(); } catch (_) {}
    res.json({ ok: false, error: 'Error interno al consultar precios', resultados: [] });
  }
});

module.exports = router;
