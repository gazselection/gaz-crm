function totalFacture(f) {
  const lignes = f.lignes || [];
  const sumLignes = lignes.reduce((s, l) => s + Number(l.prix || 0), 0);
  const envoi = Number(f.envoi || 0);
  const remise = Number(f.remise || 0);
  return (sumLignes + envoi) * (1 - remise / 100);
}

function attachLignes(db, factures) {
  if (factures.length === 0) return factures;
  const ids = new Set(factures.map((f) => f.id));
  const allLignes = db.get('lignes').filter((l) => ids.has(l.facture_id)).sortBy('ordre').value();
  const byId = {};
  for (const l of allLignes) {
    (byId[l.facture_id] = byId[l.facture_id] || []).push({
      produit: l.produit,
      qte: l.qte,
      unite: l.unite,
      prix: l.prix
    });
  }
  return factures.map((f) => ({ ...f, lignes: byId[f.id] || [] }));
}

function attachRelances(db, clients) {
  if (clients.length === 0) return clients;
  const ids = new Set(clients.map((c) => c.id));
  const allRelances = db.get('relances').filter((r) => ids.has(r.client_id)).value();
  allRelances.sort((a, b) => b.date.localeCompare(a.date));
  const byId = {};
  for (const r of allRelances) {
    (byId[r.client_id] = byId[r.client_id] || []).push({
      id: r.id,
      type: r.type,
      texte: r.texte,
      date: r.date
    });
  }
  return clients.map((c) => ({ ...c, relances: byId[c.id] || [] }));
}

module.exports = { totalFacture, attachLignes, attachRelances };
