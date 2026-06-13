#!/usr/bin/env node
/* ============================================
   PULSO · INGESTA DE SEPA
   Uso: node scripts/ingestar-sepa.js <ruta-al-zip>
   Emite líneas "PROGRESS:N:descripción" para el panel admin.
   Swap atómico: si algo falla, sepa.db queda intacta.
   ============================================ */

const path = require('path');
const fs   = require('fs');
const AdmZip = require('adm-zip');
const Database = require('better-sqlite3');

const ZIP_PATH = process.argv[2];
const DB_PATH  = process.env.DB_PATH || path.join(__dirname, '..', 'sepa.db');
const DB_TMP   = DB_PATH + '.tmp';

if (!ZIP_PATH || !fs.existsSync(ZIP_PATH)) {
  console.error('Uso: node scripts/ingestar-sepa.js <ruta-al-zip>');
  process.exit(1);
}

// Mapeo de nombres conocidos del SEPA a claves del frontend
const CADENAS_MAP = {
  dia:       ['dia', 'superdia', 'supermercadosdia'],
  carrefour: ['carrefour'],
  disco:     ['disco'],
  jumbo:     ['jumbo'],
  vea:       ['vea'],
  coto:      ['coto'],
  walmart:   ['walmart', 'changomas', 'changomás'],
  toledo:    ['toledo'],
  makro:     ['makro'],
  hiper:     ['hiper'],
};

function progress(pct, msg) {
  process.stdout.write(`PROGRESS:${pct}:${msg}\n`);
}

function normalizarNombreCadena(nombre) {
  const n = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [clave, variantes] of Object.entries(CADENAS_MAP)) {
    for (const v of variantes) {
      if (n.includes(v.replace(/[^a-z0-9]/g, ''))) return clave;
    }
  }
  // Si no matchea ninguna conocida, usamos el nombre limpio como clave
  return n.slice(0, 30) || 'otro';
}

// Parsear una línea CSV con separador pipe, respetando campos vacíos
function parsearLinea(linea, sep = '|') {
  return linea.split(sep).map(v => v.trim());
}

// Quitar BOM UTF-8 si existe
function quitarBOM(str) {
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

// Encontrar índice de columna flexible (acepta variantes de nombre)
function findCol(headers, ...nombres) {
  for (const nombre of nombres) {
    const i = headers.findIndex(h => h.toLowerCase().includes(nombre.toLowerCase()));
    if (i >= 0) return i;
  }
  return -1;
}

function procesarCSV(csvBuffer, cadena, db, insertStmt) {
  let text = quitarBOM(csvBuffer.toString('utf8'));
  const lineas = text.split('\n');
  if (lineas.length < 2) return 0;

  const headers = parsearLinea(lineas[0]);

  const iEan    = findCol(headers, 'ean', 'productos_ean', 'codigo_ean');
  const iNombre = findCol(headers, 'descripcion', 'nombre', 'productos_descripcion', 'descripcion_producto');
  const iMarca  = findCol(headers, 'marca', 'productos_marca');
  const iPrecio = findCol(headers, 'precio_lista', 'precio_unitario', 'precio', 'productos_precio_lista', 'precio_unitario_promo1');

  if (iNombre < 0 || iPrecio < 0) {
    console.error(`[ingestar] Columnas no encontradas en CSV de ${cadena}. Headers: ${headers.join('|')}`);
    return 0;
  }

  let insertados = 0;
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;

    const cols = parsearLinea(linea);
    const nombre = cols[iNombre]?.trim();
    const precioStr = cols[iPrecio]?.trim().replace(',', '.');
    const precio = parseFloat(precioStr);

    if (!nombre || isNaN(precio) || precio <= 0) continue;

    const ean   = iEan  >= 0 ? (cols[iEan]?.trim()  || null) : null;
    const marca = iMarca >= 0 ? (cols[iMarca]?.trim() || null) : null;

    insertStmt.run(ean, nombre, nombre.toLowerCase(), marca, cadena, precio);
    insertados++;
  }
  return insertados;
}

async function main() {
  progress(2, 'Abriendo ZIP principal...');

  let outerZip;
  try {
    outerZip = new AdmZip(ZIP_PATH);
  } catch (e) {
    console.error('[ingestar] No se pudo abrir el ZIP:', e.message);
    process.exit(1);
  }

  const entries = outerZip.getEntries();
  progress(5, `ZIP abierto · ${entries.length} entradas encontradas`);

  // Log de las primeras 20 entradas para debug
  const preview = entries.slice(0, 20).map(e => e.entryName).join(', ');
  progress(5, `Entradas: ${preview}`);

  // Crear BD temporal
  if (fs.existsSync(DB_TMP)) fs.unlinkSync(DB_TMP);
  const db = new Database(DB_TMP);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ean TEXT,
      nombre TEXT NOT NULL,
      nombre_lower TEXT NOT NULL,
      marca TEXT,
      cadena TEXT NOT NULL,
      precio REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const insertStmt = db.prepare(
    'INSERT INTO productos (ean, nombre, nombre_lower, marca, cadena, precio) VALUES (?, ?, ?, ?, ?, ?)'
  );

  let totalFilas = 0;
  let cadenasEncontradas = 0;

  // Separar: ZIPs internos por cadena vs CSVs directos
  const zipEntries = entries.filter(e => e.entryName.endsWith('.zip'));
  const csvEntries = entries.filter(e => e.entryName.endsWith('.csv'));

  const totalEntradas = zipEntries.length || csvEntries.length;

  // ── Caso A: el ZIP principal contiene ZIPs por cadena ──
  if (zipEntries.length > 0) {
    for (let idx = 0; idx < zipEntries.length; idx++) {
      const entry = zipEntries[idx];
      const nombreArchivo = path.basename(entry.entryName, '.zip').toLowerCase();
      const cadena = normalizarNombreCadena(nombreArchivo);

      const pct = Math.round(5 + (idx / zipEntries.length) * 85);
      progress(pct, `Procesando ${entry.entryName}...`);

      let innerZip;
      try {
        innerZip = new AdmZip(entry.getData());
      } catch (e) {
        console.error(`[ingestar] Error abriendo ZIP interno ${entry.entryName}:`, e.message);
        continue;
      }

      const csvs = innerZip.getEntries().filter(e => e.entryName.endsWith('.csv'));
      const insertMany = db.transaction(() => {
        let filas = 0;
        for (const csv of csvs) {
          filas += procesarCSV(csv.getData(), cadena, db, insertStmt);
        }
        return filas;
      });

      const filas = insertMany();
      totalFilas += filas;
      cadenasEncontradas++;
      progress(pct, `${cadena}: ${filas.toLocaleString('es-AR')} productos`);
    }

  // ── Caso B: el ZIP principal contiene CSVs directamente ──
  } else if (csvEntries.length > 0) {
    for (let idx = 0; idx < csvEntries.length; idx++) {
      const entry = csvEntries[idx];
      const nombreArchivo = path.basename(entry.entryName, '.csv').toLowerCase();
      const cadena = normalizarNombreCadena(nombreArchivo);

      const pct = Math.round(5 + (idx / csvEntries.length) * 85);
      progress(pct, `Procesando ${entry.entryName}...`);

      const filas = db.transaction(() =>
        procesarCSV(entry.getData(), cadena, db, insertStmt)
      )();

      totalFilas += filas;
      cadenasEncontradas++;
      progress(pct, `${cadena}: ${filas.toLocaleString('es-AR')} productos`);
    }
  } else {
    console.error('[ingestar] El ZIP no contiene ZIPs ni CSVs reconocibles');
    db.close();
    fs.unlinkSync(DB_TMP);
    process.exit(1);
  }

  progress(92, `Creando índices (${totalFilas.toLocaleString('es-AR')} filas)...`);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_nombre_lower ON productos(nombre_lower);
    CREATE INDEX IF NOT EXISTS idx_ean ON productos(ean);
    CREATE INDEX IF NOT EXISTS idx_cadena ON productos(cadena);
  `);

  const now = new Date().toISOString();
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('last_update', ?)").run(now);
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('source_file', ?)").run(path.basename(ZIP_PATH));
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('total_rows',  ?)").run(String(totalFilas));
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('cadenas',     ?)").run(String(cadenasEncontradas));

  db.close();

  progress(97, 'Swap atómico...');

  // Swap atómico: renombrar vieja a .bak, nueva a definitiva
  if (fs.existsSync(DB_PATH)) {
    fs.renameSync(DB_PATH, DB_PATH + '.bak');
  }
  fs.renameSync(DB_TMP, DB_PATH);
  if (fs.existsSync(DB_PATH + '.bak')) {
    try { fs.unlinkSync(DB_PATH + '.bak'); } catch (_) {}
  }

  progress(100, `Listo · ${cadenasEncontradas} cadenas · ${totalFilas.toLocaleString('es-AR')} productos`);
  console.log(`[ingestar] Completado: ${totalFilas} filas, ${cadenasEncontradas} cadenas`);
}

main().catch(e => {
  console.error('[ingestar] ERROR FATAL:', e.message);
  // Si hay DB temporal, la borramos para no dejar basura
  if (fs.existsSync(DB_TMP)) try { fs.unlinkSync(DB_TMP); } catch (_) {}
  process.exit(1);
});
