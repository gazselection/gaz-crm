const { Router } = require('express');
const { nanoid } = require('nanoid');
const { db } = require('../db');
const { attachRelances } = require('../helpers');

const router = Router();

router.get('/', (req, res) => {
  const rows = db.get('clients').sortBy('code').value();
  res.json(attachRelances(db, rows));
});

router.get('/:id', (req, res) => {
  const c = db.get('clients').find({ id: req.params.id }).value();
  if (!c) return res.status(404).json({ error: 'not found' });
  const [withR] = attachRelances(db, [c]);
  res.json(withR);
});

router.post('/', (req, res) => {
  const id = req.body.id || 'c_' + nanoid(8);
  const c = {
    id,
    code: req.body.code || nextCode(),
    nom: req.body.nom || '',
    contact: req.body.contact || '',
    email: req.body.email || '',
    tel: req.body.tel || '',
    adresse: req.body.adresse || '',
    pays: req.body.pays || 'France',
    statut: req.body.statut || 'prospect',
    remise: Number(req.body.remise) || 0,
    notes: req.body.notes || '',
    created_at: new Date().toISOString()
  };
  db.get('clients').push(c).write();
  res.status(201).json({ ...c, relances: [] });
});

router.put('/:id', (req, res) => {
  const exist = db.get('clients').find({ id: req.params.id }).value();
  if (!exist) return res.status(404).json({ error: 'not found' });
  const updates = {
    code: req.body.code || '',
    nom: req.body.nom || '',
    contact: req.body.contact || '',
    email: req.body.email || '',
    tel: req.body.tel || '',
    adresse: req.body.adresse || '',
    pays: req.body.pays || 'France',
    statut: req.body.statut || 'prospect',
    remise: Number(req.body.remise) || 0,
    notes: req.body.notes || ''
  };
  db.get('clients').find({ id: req.params.id }).assign(updates).write();
  const updated = db.get('clients').find({ id: req.params.id }).value();
  const [out] = attachRelances(db, [updated]);
  res.json(out);
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const facIds = db.get('factures').filter({ cid: id }).map('id').value();
  if (facIds.length > 0) {
    db.set('lignes', db.get('lignes').filter((l) => !facIds.includes(l.facture_id)).value()).write();
    db.get('factures').remove({ cid: id }).write();
  }
  db.get('relances').remove({ client_id: id }).write();
  db.get('clients').remove({ id }).write();
  res.json({ ok: true });
});

router.post('/:id/relances', (req, res) => {
  const exist = db.get('clients').find({ id: req.params.id }).value();
  if (!exist) return res.status(404).json({ error: 'not found' });
  const r = {
    id: 'r_' + nanoid(8),
    client_id: req.params.id,
    type: req.body.type || 'note',
    texte: req.body.texte || '',
    date: req.body.date || new Date().toISOString().slice(0, 10)
  };
  db.get('relances').push(r).write();
  res.status(201).json({ id: r.id, type: r.type, texte: r.texte, date: r.date });
});

router.delete('/:id/relances/:rid', (req, res) => {
  db.get('relances').remove({ id: req.params.rid, client_id: req.params.id }).write();
  res.json({ ok: true });
});

function nextCode() {
  const rows = db.get('clients').filter((c) => /^GAZ-\d+$/.test(c.code)).value();
  let max = 0;
  for (const { code } of rows) {
    const m = /^GAZ-(\d+)$/.exec(code);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return 'GAZ-' + String(max + 1).padStart(3, '0');
}

module.exports = router;
