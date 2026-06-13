/* ============================================
   PULSO · API ADMIN (SEPA)
   POST /api/admin/upload    sube el ZIP del SEPA
   POST /api/admin/process   dispara la ingesta
   GET  /api/admin/status    estado de la BD
   GET  /api/admin/progress  progreso de la ingesta (SSE)
   Protegido: requiere header X-Admin-Token o body.token
   ============================================ */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const DB_PATH     = path.join(__dirname, '..', 'sepa.db');
const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'ingestar-sepa.js');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 600 * 1024 * 1024 }, // 600 MB
  fileFilter(req, file, cb) {
    cb(null, file.originalname.endsWith('.zip'));
  }
});

// Estado compartido del proceso de ingesta (en memoria, suficiente para 1 instancia)
let ingestaState = {
  running: false,
  progress: 0,   // 0-100
  step: '',
  log: [],
  lastError: null,
  lastSuccess: null
};

// ============= MIDDLEWARE DE AUTH =============
function auth(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return res.status(500).json({ ok: false, error: 'ADMIN_PASSWORD no configurada en el servidor' });
  }
  const token = req.headers['x-admin-token'] || req.body?.token || req.query?.token;
  if (token !== password) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }
  next();
}

// ============= STATUS =============
router.get('/status', auth, (req, res) => {
  let dbInfo = null;

  if (fs.existsSync(DB_PATH)) {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(DB_PATH, { readonly: true });
      const count = db.prepare('SELECT COUNT(*) as n FROM productos').get();
      const meta  = db.prepare('SELECT key, value FROM meta').all();
      db.close();
      const stat = fs.statSync(DB_PATH);
      const metaObj = {};
      meta.forEach(r => { metaObj[r.key] = r.value; });
      dbInfo = {
        exists: true,
        rows: count.n,
        sizeMB: (stat.size / 1024 / 1024).toFixed(1),
        lastUpdate: metaObj.last_update || null,
        sourceFile: metaObj.source_file || null
      };
    } catch (e) {
      dbInfo = { exists: true, error: e.message };
    }
  } else {
    dbInfo = { exists: false };
  }

  res.json({
    ok: true,
    db: dbInfo,
    ingesta: {
      running: ingestaState.running,
      progress: ingestaState.progress,
      step: ingestaState.step,
      lastError: ingestaState.lastError,
      lastSuccess: ingestaState.lastSuccess
    }
  });
});

// ============= UPLOAD ZIP =============
router.post('/upload', auth, upload.single('zip'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No se recibió archivo ZIP' });
  }

  const dest = path.join(UPLOADS_DIR, 'sepa_pendiente.zip');
  fs.renameSync(req.file.path, dest);

  res.json({
    ok: true,
    message: 'ZIP recibido',
    file: dest,
    sizeMB: (req.file.size / 1024 / 1024).toFixed(1)
  });
});

// ============= PROCESS (dispara ingesta en background) =============
router.post('/process', auth, (req, res) => {
  if (ingestaState.running) {
    return res.status(409).json({ ok: false, error: 'Ya hay una ingesta en curso' });
  }

  const zipPath = path.join(UPLOADS_DIR, 'sepa_pendiente.zip');
  if (!fs.existsSync(zipPath)) {
    return res.status(400).json({ ok: false, error: 'No hay ZIP pendiente. Subí un ZIP primero.' });
  }

  ingestaState = {
    running: true,
    progress: 0,
    step: 'Iniciando...',
    log: [],
    lastError: null,
    lastSuccess: null
  };

  const child = spawn('node', ['--max-old-space-size=400', SCRIPT_PATH, zipPath], {
    env: { ...process.env, DB_PATH }
  });

  child.stdout.on('data', data => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      ingestaState.log.push(line);
      // Parsear progreso: el script emite "PROGRESS:50:Procesando cadena X"
      const m = line.match(/^PROGRESS:(\d+):(.+)$/);
      if (m) {
        ingestaState.progress = parseInt(m[1]);
        ingestaState.step = m[2];
      }
    });
  });

  child.stderr.on('data', data => {
    ingestaState.log.push('[err] ' + data.toString().trim());
  });

  child.on('close', code => {
    ingestaState.running = false;
    if (code === 0) {
      ingestaState.progress = 100;
      ingestaState.step = 'Completado';
      ingestaState.lastSuccess = new Date().toISOString();
      // Borrar ZIP pendiente
      try { fs.unlinkSync(zipPath); } catch (_) {}
    } else {
      ingestaState.lastError = `El script salió con código ${code}`;
      ingestaState.step = 'Error';
    }
  });

  res.json({ ok: true, message: 'Ingesta iniciada en background' });
});

// ============= PROGRESS (SSE para el panel admin) =============
router.get('/progress', auth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = () => {
    res.write(`data: ${JSON.stringify({
      running:  ingestaState.running,
      progress: ingestaState.progress,
      step:     ingestaState.step,
      log:      ingestaState.log.slice(-30)
    })}\n\n`);
  };

  send();
  const interval = setInterval(send, 1500);

  req.on('close', () => clearInterval(interval));
});

module.exports = router;
