const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const { seedClients, seedFactures, seedSettings } = require('./seed');

// Sur Railway : LOWDB_PATH=/data/gaz.json (volume persistant monté sur /data)
// En local   : gaz.json à la racine du projet
const DB_PATH = process.env.LOWDB_PATH || path.join(__dirname, '..', 'gaz.json');

// S'assure que le dossier parent existe (volume Railway vide au premier boot)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const adapter = new FileSync(DB_PATH);
const db = low(adapter);

function init() {
  db.defaults({ clients: [], relances: [], factures: [], lignes: [], settings: {} }).write();

  if (db.get('clients').size().value() === 0) {
    console.log('[db] Empty database, seeding initial data...');
    seed();
  }
}

function seed() {
  const clients = seedClients.map((c) => ({
    id: c.id,
    code: c.code,
    nom: c.nom,
    contact: c.contact || '',
    email: c.email || '',
    tel: c.tel || '',
    adresse: c.adresse || '',
    pays: c.pays || 'France',
    statut: c.statut || 'prospect',
    remise: c.remise || 0,
    notes: c.notes || '',
    created_at: new Date().toISOString()
  }));

  const relances = seedClients.flatMap((c) =>
    (c.relances || []).map((r) => ({
      id: r.id,
      client_id: c.id,
      type: r.type,
      texte: r.texte || '',
      date: r.date
    }))
  );

  const factures = seedFactures.map((f) => ({
    id: f.id,
    cid: f.cid,
    num: f.num,
    date: f.date,
    type: f.type || 'facture',
    envoi: f.envoi || 0,
    remise: f.remise || 0,
    paiement: f.paiement || 'virement',
    statut: f.statut,
    notes: f.notes || '',
    created_at: new Date().toISOString()
  }));

  const lignes = seedFactures.flatMap((f) =>
    (f.lignes || []).map((l, i) => ({
      facture_id: f.id,
      produit: l.produit || '',
      qte: String(l.qte || ''),
      unite: l.unite || '',
      prix: Number(l.prix) || 0,
      ordre: i
    }))
  );

  db.set('clients', clients)
    .set('relances', relances)
    .set('factures', factures)
    .set('lignes', lignes)
    .set('settings', seedSettings)
    .write();

  console.log(`[db] Seeded ${clients.length} clients, ${factures.length} factures.`);
}

module.exports = { db, init };
