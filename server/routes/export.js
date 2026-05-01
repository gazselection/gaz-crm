const { Router } = require('express');
const { db } = require('../db');
const { totalFacture, attachLignes } = require('../helpers');

const router = Router();

router.get('/csv', (req, res) => {
  const mois = req.query.mois || '';
  let rows;
  if (mois) {
    rows = db.get('factures').filter((f) => f.date && f.date.slice(0, 7) === mois).sortBy(['date', 'num']).value();
  } else {
    rows = db.get('factures').sortBy(['date', 'num']).value();
  }
  const factures = attachLignes(db, rows);
  const clients = db.get('clients').value();
  const cMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const header = ['Date', 'Numéro', 'Type', 'Client', 'Code client', 'Pays', 'Produits', 'Montant HT', 'Statut', 'Paiement'];
  const lines = [header.join(';')];
  for (const f of factures) {
    const cl = cMap[f.cid] || { nom: '?', code: '?', pays: '?' };
    const prods = (f.lignes || [])
      .map((l) => `${l.qte ? l.qte + ' ' : ''}${l.produit}`)
      .join(' | ')
      .replace(/;/g, ',');
    const row = [
      f.date,
      f.num,
      f.type,
      cl.nom.replace(/;/g, ','),
      cl.code,
      cl.pays,
      prods,
      totalFacture(f).toFixed(2).replace('.', ','),
      f.statut,
      f.paiement
    ];
    lines.push(row.join(';'));
  }
  const csv = '﻿' + lines.join('\r\n');
  const filename = `gaz-export-${mois || 'tout'}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

module.exports = router;
