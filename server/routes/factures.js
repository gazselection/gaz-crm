const { Router } = require('express');
const { nanoid } = require('nanoid');
const { db } = require('../db');
const { attachLignes } = require('../helpers');

const router = Router();

// Must be declared before /:id to avoid route conflict
router.get('/util/next-num', (req, res) => {
  const type = req.query.type === 'devis' ? 'devis' : 'facture';
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  res.json({ num: nextNum(type, date) });
});

router.get('/', (req, res) => {
  const rows = db.get('factures').orderBy(['date', 'num'], ['desc', 'desc']).value();
  res.json(attachLignes(db, rows));
});

router.get('/:id', (req, res) => {
  const row = db.get('factures').find({ id: req.params.id }).value();
  if (!row) return res.status(404).json({ error: 'not found' });
  const [out] = attachLignes(db, [row]);
  res.json(out);
});

router.post('/', (req, res) => {
  const id = req.body.id || 'f_' + nanoid(8);
  const type = req.body.type || 'facture';
  const num = req.body.num && req.body.num.trim() ? req.body.num : nextNum(type, req.body.date);
  const f = {
    id,
    cid: req.body.cid,
    num,
    date: req.body.date || new Date().toISOString().slice(0, 10),
    type,
    envoi: Number(req.body.envoi) || 0,
    remise: Number(req.body.remise) || 0,
    paiement: req.body.paiement || 'virement',
    statut: req.body.statut || 'envoyee',
    notes: req.body.notes || '',
    created_at: new Date().toISOString()
  };
  const lignes = Array.isArray(req.body.lignes) ? req.body.lignes : [];

  db.get('factures').push(f).write();
  const newLignes = lignes.map((l, i) => ({
    facture_id: f.id,
    produit: l.produit || '',
    qte: String(l.qte || ''),
    unite: l.unite || '',
    prix: Number(l.prix) || 0,
    ordre: i
  }));
  if (newLignes.length > 0) {
    db.set('lignes', db.get('lignes').value().concat(newLignes)).write();
  }
  res.status(201).json({ ...f, lignes });
});

router.put('/:id', (req, res) => {
  const exist = db.get('factures').find({ id: req.params.id }).value();
  if (!exist) return res.status(404).json({ error: 'not found' });
  const updates = {
    cid: req.body.cid,
    num: req.body.num,
    date: req.body.date,
    type: req.body.type || 'facture',
    envoi: Number(req.body.envoi) || 0,
    remise: Number(req.body.remise) || 0,
    paiement: req.body.paiement || 'virement',
    statut: req.body.statut || 'envoyee',
    notes: req.body.notes || ''
  };
  const lignes = Array.isArray(req.body.lignes) ? req.body.lignes : [];

  db.get('factures').find({ id: req.params.id }).assign(updates).write();
  db.set('lignes', db.get('lignes').filter((l) => l.facture_id !== req.params.id).value()).write();
  const newLignes = lignes.map((l, i) => ({
    facture_id: req.params.id,
    produit: l.produit || '',
    qte: String(l.qte || ''),
    unite: l.unite || '',
    prix: Number(l.prix) || 0,
    ordre: i
  }));
  if (newLignes.length > 0) {
    db.set('lignes', db.get('lignes').value().concat(newLignes)).write();
  }
  res.json({ id: req.params.id, ...updates, lignes });
});

router.patch('/:id/statut', (req, res) => {
  const allowed = ['devis', 'envoyee', 'payee', 'impayee', 'annulee'];
  if (!allowed.includes(req.body.statut)) {
    return res.status(400).json({ error: 'invalid statut' });
  }
  db.get('factures').find({ id: req.params.id }).assign({ statut: req.body.statut }).write();
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.set('lignes', db.get('lignes').filter((l) => l.facture_id !== req.params.id).value()).write();
  db.get('factures').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

function nextNum(type, date) {
  const yr = (date || new Date().toISOString().slice(0, 10)).slice(0, 4);
  const prefix = type === 'devis' ? 'DEV' : 'FAC';
  const re = new RegExp(`^${prefix}-${yr}-(\\d+)`);
  const rows = db.get('factures').filter((f) => f.num && f.num.startsWith(`${prefix}-${yr}-`)).value();
  let max = 0;
  for (const { num } of rows) {
    const m = re.exec(num);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${yr}-${String(max + 1).padStart(3, '0')}`;
}

module.exports = router;
