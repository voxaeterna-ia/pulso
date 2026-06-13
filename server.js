/* ============================================
   PULSO · SERVIDOR PRINCIPAL
   Sirve el frontend estático + rutas /api/*
   Requiere disco persistente (no serverless)
   ============================================ */

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

// Frontend estático
app.use(express.static(path.join(__dirname)));

// Admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API routes
app.use('/api/precios', require('./api/precios'));
app.use('/api/admin',   require('./api/admin'));
app.use('/api/byma',    require('./api/byma'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Pulso corriendo en http://localhost:${PORT}`);
  console.log(`Panel admin en  http://localhost:${PORT}/admin`);
});
