// PM2 — gestor de procesos para producción
// Uso: pm2 start ecosystem.config.js
// Docs: https://pm2.keymetrics.io

module.exports = {
  apps: [{
    name: 'pulso',
    script: 'server.js',
    cwd: '/var/www/pulso',       // ajustá esta ruta a donde tenés el repo en el VPS
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
      // ADMIN_PASSWORD se lee del .env automáticamente (dotenv)
    },
    error_file: 'logs/err.log',
    out_file:   'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
