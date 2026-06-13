#!/usr/bin/env node
/* ============================================
   PULSO · INGESTA DE SEPA
   Usa unzip del sistema para evitar problemas de RAM.
   Swap atómico: si algo falla, sepa.db queda intacta.
   ============================================ */

const path = require('path');
const fs   = require('fs');
const { execSync, spawnSync } = require('child_process');
const Database = require('better-sqlite3');

const ZIP_PATH = process.argv[2];
const DB_PATH  = process.env.DB_PATH || path.join(__dirname, '..', 'sepa.db');
const DB_TMP   = DB_PATH + '.tmp';
const TMP_DIR  = '/tmp/sepa_extract_' + Date.now();

if (!ZIP_PATH || !fs.existsSync(ZIP_PATH)) {
  console.error('Uso: node scripts/ingestar-sepa.js <ruta-al-zip>');
  process.exit(1);
}

function progress(pct, msg) {
  process.stdout.write(`PROGRESS:${pct}:${msg}\n`);
}

function normalizarNombreCadena(nombre) {
  if (!nombre) return 'otro';
  const n = nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  const MAP = {
    dia:       ['supermercadosdia', 'superdia', 'diaarg'],
    carrefour: ['carrefour'],
    disco:     ['disco'],
    jumbo:     ['jumbo'],
    vea:       ['vea'],
    coto:      ['coto'],
    walmart:   ['walmart'],
    changomas: ['changomas'],
    toledo:    ['toledo'],
    makro:     ['makro'],
    laanonima: ['anonima'],
    agricola:  ['agricola'],
    libertad:  ['libertad'],
    atomo:     ['atomo'],
    diarco:    ['diarco'],
    ekono:     ['ekono'],
  };
  for (const [clave, variantes] of Object.entries(MAP)) {
    for (const v of variantes) {
      if (n.includes(v)) return clave;
    }
  }
  return nombre.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase().replace(/\s+/g, '').slice(0, 25) || 'otro';
}

function parsearLinea(linea) {
  return linea.split('|').map(v => v.trim());
}

function quitarBOM(str) {
  return str.charCodeAt(0) === 0xFEFF ? str.slice(1) : str;
}

function findCol(headers, ...nombres) {
  for (const nombre of nombres) {
    const i = headers.findIndex(h => h.toLowerCase().includes(nombre.toLowerCase()));
    if (i >= 0) return i;
  }
  return -1;
}

function leerNombreCadena(csvPath) {
  try {
    const text = quitarBOM(fs.readFileSync(csvPath, 'utf8'));
    const lineas = text.split('\n');
    if (lineas.length < 2) return null;
    const headers = parsearLinea(lineas[0]);
    const iNombre = findCol(headers, 'comercio_bandera_nombre', 'bandera_nombre', 'razon_social');
    if (iNombre < 0) return null;
    for (let i = 1; i < lineas.length; i++) {
      const cols = parsearLinea(lineas[i].trim());
      const nombre = cols[iNombre] && cols[iNombre].trim();
      if (nombre) return nombre;
    }
  } catch (e) {}
  return null;
}

function procesarProductosCSV(csvPath, cadena, insertStmt) {
  let text;
  try {
    text = quitarBOM(fs.readFileSync(csvPath, 'utf8'));
  } catch (e) {
    console.error('[ingestar] No se pudo leer:', csvPath);
    return 0;
  }

  const lineas = text.split('\n');
  if (lineas.length < 2) return 0;

  const headers = parsearLinea(lineas[0]);
  const iEan    = findCol(headers, 'productos_ean', 'ean', 'codigo_ean');
  const iNombre = findCol(headers, 'productos_descripcion', 'descripcion', 'nombre', 'descripcion_producto');
  const iMarca  = findCol(headers, 'productos_marca', 'marca');
  const iPrecio = findCol(headers, 'productos_precio_lista', 'precio_lista', 'precio_unitario', 'precio');

  if (iNombre < 0 || iPrecio < 0) {
    console.error(`[ingestar] Sin columnas de producto en ${path.basename(csvPath)}. Headers: ${headers.slice(0, 6).join('|')}`);
    return 0;
  }

  let insertados = 0;
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;
    const cols    = parsearLinea(linea);
    const nombre  = cols[iNombre] && cols[iNombre].trim();
    const precio  = parseFloat((cols[iPrecio] || '').trim().replace(',', '.'));
    if (!nombre || isNaN(precio) || precio <= 0) continue;
    const ean   = iEan   >= 0 ? (cols[iEan]   && cols[iEan].trim()   || null) : null;
    const marca = iMarca >= 0 ? (cols[iMarca] && cols[iMarca].trim() || null) : null;
    insertStmt.run(ean, nombre, nombre.toLowerCase(), marca, cadena, precio);
    insertados++;
  }
  return insertados;
}

function unzip(zipFile, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const result = spawnSync('unzip', ['-q', '-o', zipFile, '-d', destDir]);
  if (result.status !== 0) throw new Error('unzip falló: ' + (result.stderr || '').toString().slice(0, 200));
}

function cleanup() {
  try { execSync(`rm -rf "${TMP_DIR}"`); } catch (_) {}
}

async function main() {
  progress(2, 'Extrayendo ZIP principal al disco...');

  try {
    unzip(ZIP_PATH, TMP_DIR);
  } catch (e) {
    console.error('[ingestar] No se pudo extraer el ZIP:', e.message);
    cleanup();
    process.exit(1);
  }

  // Buscar ZIPs internos o CSVs directos
  let innerZips = [];
  let rootCsvs  = [];

  function walkDir(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walkDir(full);
      else if (item.toLowerCase().endsWith('.zip')) innerZips.push(full);
      else if (item.toLowerCase().endsWith('.csv')) rootCsvs.push(full);
    }
  }
  walkDir(TMP_DIR);

  progress(5, `Encontrados: ${innerZips.length} ZIPs internos, ${rootCsvs.length} CSVs directos`);

  if (fs.existsSync(DB_TMP)) fs.unlinkSync(DB_TMP);
  const db = new Database(DB_TMP);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ean TEXT, nombre TEXT NOT NULL, nombre_lower TEXT NOT NULL,
      marca TEXT, cadena TEXT NOT NULL, precio REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
  `);
  const insertStmt = db.prepare(
    'INSERT INTO productos (ean, nombre, nombre_lower, marca, cadena, precio) VALUES (?, ?, ?, ?, ?, ?)'
  );

  let totalFilas = 0, cadenasEncontradas = 0;

  // ── Caso A: ZIPs internos ──
  if (innerZips.length > 0) {
    for (let idx = 0; idx < innerZips.length; idx++) {
      const zipFile = innerZips[idx];
      const pct = Math.round(5 + (idx / innerZips.length) * 85);
      progress(pct, `Procesando ${path.basename(zipFile)}...`);

      const innerDir = zipFile + '_extracted';
      try {
        unzip(zipFile, innerDir);
      } catch (e) {
        progress(pct, `Error extrayendo ${path.basename(zipFile)}: ${e.message.slice(0, 80)}`);
        continue;
      }

      // Recolectar CSVs del ZIP interno
      const csvs = [];
      function walkInner(dir) {
        for (const item of fs.readdirSync(dir)) {
          const full = path.join(dir, item);
          if (fs.statSync(full).isDirectory()) walkInner(full);
          else if (item.toLowerCase().endsWith('.csv')) csvs.push(full);
        }
      }
      walkInner(innerDir);

      // Obtener nombre de cadena del CSV de comercios
      const comerciosCSV = csvs.find(f => path.basename(f).toLowerCase().includes('comercio'));
      const productosCsvs = csvs.filter(f => {
        const n = path.basename(f).toLowerCase();
        return !n.includes('comercio') && !n.includes('sucursal');
      });

      let cadena = normalizarNombreCadena(path.basename(zipFile, '.zip'));
      if (comerciosCSV) {
        const nombreReal = leerNombreCadena(comerciosCSV);
        if (nombreReal) {
          cadena = normalizarNombreCadena(nombreReal);
          progress(pct, `Cadena: "${nombreReal}" → ${cadena}`);
        }
      }

      const csvsProcesar = productosCsvs.length > 0 ? productosCsvs : csvs;
      const filas = db.transaction(() => {
        let total = 0;
        for (const csv of csvsProcesar) total += procesarProductosCSV(csv, cadena, insertStmt);
        return total;
      })();

      if (filas > 0) { totalFilas += filas; cadenasEncontradas++; }
      progress(pct, `${cadena}: ${filas.toLocaleString('es-AR')} productos`);

      // Liberar espacio del ZIP interno extraído
      try { execSync(`rm -rf "${innerDir}"`); } catch (_) {}
    }

  // ── Caso B: CSVs directos ──
  } else if (rootCsvs.length > 0) {
    const comerciosCSV = rootCsvs.find(f => path.basename(f).toLowerCase().includes('comercio'));
    const productosCsvs = rootCsvs.filter(f => {
      const n = path.basename(f).toLowerCase();
      return !n.includes('comercio') && !n.includes('sucursal');
    });
    const csvsProcesar = productosCsvs.length > 0 ? productosCsvs : rootCsvs;

    for (let idx = 0; idx < csvsProcesar.length; idx++) {
      const csvPath = csvsProcesar[idx];
      const pct = Math.round(5 + (idx / csvsProcesar.length) * 85);
      const cadena = comerciosCSV
        ? normalizarNombreCadena(leerNombreCadena(comerciosCSV))
        : normalizarNombreCadena(path.basename(csvPath, '.csv'));
      progress(pct, `Procesando ${path.basename(csvPath)}...`);
      const filas = db.transaction(() => procesarProductosCSV(csvPath, cadena, insertStmt))();
      if (filas > 0) { totalFilas += filas; cadenasEncontradas++; }
    }
  } else {
    console.error('[ingestar] No se encontraron ZIPs ni CSVs en el archivo');
    db.close();
    cleanup();
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
  db.prepare("INSERT OR REPLACE INTO meta VALUES ('last_update', ?)").run(now);
  db.prepare("INSERT OR REPLACE INTO meta VALUES ('source_file', ?)").run(path.basename(ZIP_PATH));
  db.prepare("INSERT OR REPLACE INTO meta VALUES ('total_rows', ?)").run(String(totalFilas));
  db.prepare("INSERT OR REPLACE INTO meta VALUES ('cadenas', ?)").run(String(cadenasEncontradas));
  db.close();

  progress(97, 'Limpiando temporales y swap atómico...');
  cleanup();

  if (fs.existsSync(DB_PATH)) fs.renameSync(DB_PATH, DB_PATH + '.bak');
  fs.renameSync(DB_TMP, DB_PATH);
  if (fs.existsSync(DB_PATH + '.bak')) try { fs.unlinkSync(DB_PATH + '.bak'); } catch (_) {}

  progress(100, `Listo · ${cadenasEncontradas} cadenas · ${totalFilas.toLocaleString('es-AR')} productos`);
  console.log(`[ingestar] Completado: ${totalFilas} filas, ${cadenasEncontradas} cadenas`);
}

main().catch(e => {
  console.error('[ingestar] ERROR FATAL:', e.message);
  cleanup();
  if (fs.existsSync(DB_TMP)) try { fs.unlinkSync(DB_TMP); } catch (_) {}
  process.exit(1);
});
