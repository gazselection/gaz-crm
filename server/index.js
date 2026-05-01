const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { init } = require('./db');
const clientsRoute = require('./routes/clients');
const facturesRoute = require('./routes/factures');
const settingsRoute = require('./routes/settings');
const exportRoute = require('./routes/export');

init();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/clients', clientsRoute);
app.use('/api/factures', facturesRoute);
app.use('/api/settings', settingsRoute);
app.use('/api/export', exportRoute);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// En production, on sert le build du client.
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// En dev: Vite tourne sur 3000 et proxy vers /api -> 3001. En prod: tout sur 3000.
const PORT = process.env.PORT
  ? Number(process.env.PORT)
  : process.env.NODE_ENV === 'production'
    ? 3000
    : 3001;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[server] dev mode — frontend served separately by Vite (port 3000)');
  }
});
