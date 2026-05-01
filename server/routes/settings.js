const { Router } = require('express');
const { db } = require('../db');

const router = Router();

router.get('/', (req, res) => {
  res.json(db.get('settings').value() || {});
});

router.put('/', (req, res) => {
  const current = db.get('settings').value() || {};
  const updated = { ...current };
  for (const [k, v] of Object.entries(req.body || {})) {
    updated[k] = v == null ? '' : String(v);
  }
  db.set('settings', updated).write();
  res.json({ ok: true });
});

module.exports = router;
