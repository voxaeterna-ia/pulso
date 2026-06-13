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

const CADENAS = {
  dia:       'Día',
  carrefour: 'Carrefour',
  disco:     'Disco',
  jumbo:     'Jumbo',
  vea:       'Vea'
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

    // Agrupar: primero por ean+nombre (producto único), después por cadena
    // La UI espera resultados agrupados por supermercado
    const resultados = Object.entries(CADENAS).map(([key, nombre]) => {
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
        supermercado: nombre,
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
