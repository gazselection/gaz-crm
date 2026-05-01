import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { totalFacture, fmtEUR } from '../lib/totals';
import type { Facture, Ligne, DocType, Statut, Paiement } from '../types';

interface Props {
  factureId: string | null; // null = creation
  presetClientId?: string | null;
  onClose: () => void;
}

const STATUTS: { v: Statut; lbl: string }[] = [
  { v: 'devis', lbl: 'Devis' },
  { v: 'envoyee', lbl: 'Envoyée' },
  { v: 'payee', lbl: 'Payée' },
  { v: 'impayee', lbl: 'Impayée' },
  { v: 'annulee', lbl: 'Annulée' }
];

const PAIEMENTS: { v: Paiement; lbl: string }[] = [
  { v: 'virement', lbl: 'Virement' },
  { v: 'wallet', lbl: 'Vivawallet' },
  { v: 'especes', lbl: 'Espèces' },
  { v: 'cheque', lbl: 'Chèque' }
];

function emptyLigne(): Ligne {
  return { produit: '', qte: '', unite: '', prix: 0 };
}

export function FactureModal({ factureId, presetClientId, onClose }: Props) {
  const clients = useStore((s) => s.clients);
  const factures = useStore((s) => s.factures);
  const upsertFacture = useStore((s) => s.upsertFacture);
  const showToast = useStore((s) => s.showToast);

  const existing = factureId ? factures.find((f) => f.id === factureId) || null : null;

  const [form, setForm] = useState<Partial<Facture>>(() => {
    if (existing) return { ...existing };
    return {
      cid: presetClientId || '',
      num: '',
      date: new Date().toISOString().slice(0, 10),
      type: 'facture' as DocType,
      lignes: [emptyLigne()],
      envoi: 0,
      remise: 0,
      paiement: 'virement' as Paiement,
      statut: 'envoyee' as Statut,
      notes: ''
    };
  });

  const [clientSearch, setClientSearch] = useState(() => {
    if (existing) return clients.find((c) => c.id === existing.cid)?.nom || '';
    if (presetClientId) return clients.find((c) => c.id === presetClientId)?.nom || '';
    return '';
  });

  // Si nouvelle facture sans num, suggère le prochain numéro
  useEffect(() => {
    if (factureId) return;
    if (form.num) return;
    api
      .nextNum(form.type === 'devis' ? 'devis' : 'facture', form.date || '')
      .then((res) => setForm((f) => ({ ...f, num: res.num })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, form.date]);

  function set<K extends keyof Facture>(k: K, v: Facture[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setLigne(i: number, patch: Partial<Ligne>) {
    setForm((f) => {
      const lignes = (f.lignes || []).slice();
      lignes[i] = { ...lignes[i], ...patch };
      return { ...f, lignes };
    });
  }
  function addLigne() {
    setForm((f) => ({ ...f, lignes: [...(f.lignes || []), emptyLigne()] }));
  }
  function removeLigne(i: number) {
    setForm((f) => ({ ...f, lignes: (f.lignes || []).filter((_, j) => j !== i) }));
  }

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 12);
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.nom.toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q)).slice(0, 12);
  }, [clientSearch, clients]);

  const [showClientList, setShowClientList] = useState(false);

  const total = totalFacture(form as Facture);

  async function save() {
    if (!form.cid) {
      showToast('Sélectionnez un client', 'error');
      return;
    }
    if (!form.lignes?.length) {
      showToast('Au moins une ligne', 'error');
      return;
    }
    try {
      const saved = factureId
        ? await api.updateFacture(factureId, form)
        : await api.createFacture(form);
      upsertFacture(saved);
      showToast('Document enregistré');
      onClose();
    } catch {
      showToast('Erreur de sauvegarde', 'error');
    }
  }

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal lg">
        <div className="modal-header">
          <div className="modal-title">{factureId ? 'Modifier' : 'Nouveau'} document</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Client *</label>
              <input
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientList(true);
                }}
                onFocus={() => setShowClientList(true)}
                onBlur={() => setTimeout(() => setShowClientList(false), 150)}
                placeholder="Rechercher…"
              />
              {showClientList && filteredClients.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--dark2)',
                    border: '1px solid var(--border2)',
                    borderRadius: 6,
                    maxHeight: 240,
                    overflowY: 'auto',
                    zIndex: 10,
                    marginTop: 2
                  }}
                >
                  {filteredClients.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: 13,
                        borderBottom: '1px solid var(--border)'
                      }}
                      onMouseDown={() => {
                        set('cid', c.id);
                        setClientSearch(c.nom);
                        setShowClientList(false);
                      }}
                    >
                      <span className="code">{c.code}</span> {c.nom}{' '}
                      <span style={{ color: 'var(--text3)', fontSize: 11 }}>• {c.pays}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value as DocType)}>
                <option value="facture">Facture</option>
                <option value="devis">Devis</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Numéro</label>
              <input value={form.num || ''} onChange={(e) => set('num', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" value={form.date || ''} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lignes produits</label>
            <div className="table-wrap">
              <table className="lignes-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th style={{ width: 70 }}>Qté</th>
                    <th style={{ width: 70 }}>Unité</th>
                    <th style={{ width: 110 }}>Prix total (€)</th>
                    <th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(form.lignes || []).map((l, i) => (
                    <tr key={i}>
                      <td>
                        <input
                          value={l.produit}
                          onChange={(e) => setLigne(i, { produit: e.target.value })}
                          placeholder="Désignation…"
                        />
                      </td>
                      <td>
                        <input value={l.qte} onChange={(e) => setLigne(i, { qte: e.target.value })} />
                      </td>
                      <td>
                        <input value={l.unite} onChange={(e) => setLigne(i, { unite: e.target.value })} placeholder="g, u…" />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          value={l.prix}
                          onChange={(e) => setLigne(i, { prix: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeLigne(i)}
                          disabled={(form.lignes || []).length <= 1}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-sm" onClick={addLigne} style={{ marginTop: 6 }}>
              + Ajouter une ligne
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Frais d'envoi (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.envoi || 0}
                onChange={(e) => set('envoi', Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Remise globale (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.remise || 0}
                onChange={(e) => set('remise', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select value={form.statut} onChange={(e) => set('statut', e.target.value as Statut)}>
                {STATUTS.map((s) => (
                  <option key={s.v} value={s.v}>{s.lbl}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mode de paiement</label>
              <select value={form.paiement} onChange={(e) => set('paiement', e.target.value as Paiement)}>
                {PAIEMENTS.map((p) => (
                  <option key={p.v} value={p.v}>{p.lbl}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>

          <div
            style={{
              background: 'var(--dark2)',
              borderRadius: 8,
              padding: '12px 16px',
              border: '1px solid var(--gold)',
              textAlign: 'right'
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text3)', marginRight: 12 }}>Total TTC</span>
            <strong style={{ fontSize: 22, color: 'var(--gold-light)' }}>{fmtEUR(total)}</strong>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Annuler</button>
          <button className="btn btn-gold" onClick={save}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
