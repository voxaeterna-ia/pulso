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
    walmart:   ['walmart', 'changomas'],
    toledo:    ['toledo'],
    makro:     ['makro'],
  };
  for (const [clave, variantes] of Object.entries(MAP)) {
    for (const v of variantes) {
      if (n.includes(v)) return clave;
    }
  }
  // Fallback: primeras 20 letras del nombre original limpio
  return nombre.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'otro';
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

// Lee el nombre de la cadena desde el CSV de comercios
function leerNombreCadena(csvBuffer) {
  const text = quitarBOM(csvBuffer.toString('utf8'));
  const lineas = text.split('\n');
  if (lineas.length < 2) return null;
  const headers = parsearLinea(lineas[0]);
  const iNombre = findCol(headers, 'comercio_bandera_nombre', 'bandera_nombre', 'razon_social');
  if (iNombre < 0) return null;
  // Buscar la primera fila con datos
  for (let i = 1; i < lineas.length; i++) {
    const cols = parsearLinea(lineas[i].trim());
    const nombre = cols[iNombre]?.trim();
    if (nombre) return nombre;
  }
  return null;
}

function procesarProductosCSV(csvBuffer, cadena, insertStmt) {
  const text = quitarBOM(csvBuffer.toString('utf8'));
  const lineas = text.split('\n');
  if (lineas.length < 2) return 0;

  const headers = parsearLinea(lineas[0]);

  const iEan    = findCol(headers, 'productos_ean', 'ean', 'codigo_ean');
  const iNombre = findCol(headers, 'productos_descripcion', 'descripcion', 'nombre', 'descripcion_producto');
  const iMarca  = findCol(headers, 'productos_marca', 'marca');
  const iPrecio = findCol(headers, 'productos_precio_lista', 'precio_lista', 'precio_unitario', 'precio');

  if (iNombre < 0 || iPrecio < 0) {
    console.error(`[ingestar] Sin columnas de producto en CSV de ${cadena}. Headers: ${headers.slice(0,8).join('|')}`);
    return 0;
  }

  let insertados = 0;
  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;

    const cols   = parsearLinea(linea);
    const nombre = cols[iNombre]?.trim();
    const precioStr = cols[iPrecio]?.trim().replace(',', '.');
    const precio = parseFloat(precioStr);

    if (!nombre || isNaN(precio) || precio <= 0) continue;

    const ean   = iEan   >= 0 ? (cols[iEan]?.trim()   || null) : null;
    const marca = iMarca >= 0 ? (cols[iMarca]?.trim()  || null) : null;

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
  progress(5, `ZIP abierto · ${entries.length} entradas`);

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

  const zipEntries = entries.filter(e => e.entryName.endsWith('.zip'));
  const csvEntries = entries.filter(e => e.entryName.endsWith('.csv'));

  // ── Caso A: ZIP principal → ZIPs internos por cadena ──
  if (zipEntries.length > 0) {
    for (let idx = 0; idx < zipEntries.length; idx++) {
      const entry = zipEntries[idx];
      const pct = Math.round(5 + (idx / zipEntries.length) * 85);
      progress(pct, `Abriendo ${path.basename(entry.entryName)}...`);

      let innerZip;
      try {
        innerZip = new AdmZip(entry.getData());
      } catch (e) {
        console.error(`[ingestar] Error abriendo ZIP interno ${entry.entryName}:`, e.message);
        continue;
      }

      const innerEntries = innerZip.getEntries();
      const csvs = innerEntries.filter(e => e.entryName.toLowerCase().endsWith('.csv'));

      // Identificar CSV de comercios (para obtener el nombre de la cadena)
      const comerciosCSV = csvs.find(e => e.entryName.toLowerCase().includes('comercio'));
      // Identificar CSV de productos (excluir comercios y sucursales)
      const productosCSVs = csvs.filter(e => {
        const n = e.entryName.toLowerCase();
        return !n.includes('comercio') && !n.includes('sucursal');
      });

      // Obtener nombre de cadena
      let cadena = path.basename(entry.entryName, '.zip').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      if (comerciosCSV) {
        const nombreReal = leerNombreCadena(comerciosCSV.getData());
        if (nombreReal) {
          cadena = normalizarNombreCadena(nombreReal);
          progress(pct, `Cadena detectada: "${nombreReal}" → ${cadena}`);
        }
      }

      // Si no hay CSVs de productos, intentar con todos
      const csvsProcesar = productosCSVs.length > 0 ? productosCSVs : csvs;

      const filas = db.transaction(() => {
        let total = 0;
        for (const csv of csvsProcesar) {
          total += procesarProductosCSV(csv.getData(), cadena, insertStmt);
        }
        return total;
      })();

      if (filas > 0) {
        totalFilas += filas;
        cadenasEncontradas++;
        progress(pct, `${cadena}: ${filas.toLocaleString('es-AR')} productos`);
      }
    }

  // ── Caso B: ZIP principal → CSVs directos ──
  } else if (csvEntries.length > 0) {
    // Buscar CSV de comercios para mapear id_bandera → nombre
    const comerciosEntry = csvEntries.find(e => e.entryName.toLowerCase().includes('comercio'));
    let banderaNombre = null;
    if (comerciosEntry) {
      banderaNombre = leerNombreCadena(comerciosEntry.getData());
    }

    const productosCsvs = csvEntries.filter(e => {
      const n = e.entryName.toLowerCase();
      return !n.includes('comercio') && !n.includes('sucursal');
    });

    const csvsProcesar = productosCsvs.length > 0 ? productosCsvs : csvEntries;

    for (let idx = 0; idx < csvsProcesar.length; idx++) {
      const entry = csvsProcesar[idx];
      const pct = Math.round(5 + (idx / csvsProcesar.length) * 85);
      progress(pct, `Procesando ${path.basename(entry.entryName)}...`);

      const cadena = banderaNombre
        ? normalizarNombreCadena(banderaNombre)
        : normalizarNombreCadena(path.basename(entry.entryName, '.csv'));

      const filas = db.transaction(() =>
        procesarProductosCSV(entry.getData(), cadena, insertStmt)
      )();

      if (filas > 0) {
        totalFilas += filas;
        cadenasEncontradas++;
        progress(pct, `${cadena}: ${filas.toLocaleString('es-AR')} productos`);
      }
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
  if (fs.existsSync(DB_PATH)) fs.renameSync(DB_PATH, DB_PATH + '.bak');
  fs.renameSync(DB_TMP, DB_PATH);
  if (fs.existsSync(DB_PATH + '.bak')) try { fs.unlinkSync(DB_PATH + '.bak'); } catch (_) {}

  progress(100, `Listo · ${cadenasEncontradas} cadenas · ${totalFilas.toLocaleString('es-AR')} productos`);
  console.log(`[ingestar] Completado: ${totalFilas} filas, ${cadenasEncontradas} cadenas`);
}

main().catch(e => {
  console.error('[ingestar] ERROR FATAL:', e.message);
  if (fs.existsSync(DB_TMP)) try { fs.unlinkSync(DB_TMP); } catch (_) {}
  process.exit(1);
});
