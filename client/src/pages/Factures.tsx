import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { api, csvUrl } from '../api';
import { totalFacture, fmtEUR, fmtEUR0, fmtDate } from '../lib/totals';
import { StatutBadge, TypePill } from '../components/Badge';
import { FactureModal } from '../components/FactureModal';
import { FacturePreview, downloadFacturePDF } from '../components/FacturePreview';
import type { Statut } from '../types';

const MOIS_LBL = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const FILTERS: { v: Statut | 'all'; lbl: string }[] = [
  { v: 'all', lbl: 'Tous' },
  { v: 'devis', lbl: 'Devis' },
  { v: 'envoyee', lbl: 'Envoyée' },
  { v: 'payee', lbl: 'Payée' },
  { v: 'impayee', lbl: '⚠️ Impayée' },
  { v: 'annulee', lbl: 'Annulée' }
];

export default function Factures() {
  const factures = useStore((s) => s.factures);
  const clients = useStore((s) => s.clients);
  const settings = useStore((s) => s.settings);
  const removeFacture = useStore((s) => s.removeFacture);
  const upsertFacture = useStore((s) => s.upsertFacture);
  const showToast = useStore((s) => s.showToast);

  const [filter, setFilter] = useState<Statut | 'all'>('all');
  const [search, setSearch] = useState('');
  const [pays, setPays] = useState('');
  const [mois, setMois] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const paysList = useMemo(() => {
    const set = new Set<string>();
    for (const f of factures) {
      const cl = clients.find((c) => c.id === f.cid);
      if (cl?.pays) set.add(cl.pays);
    }
    return Array.from(set).sort();
  }, [factures, clients]);

  const moisList = useMemo(() => {
    const set = new Set<string>();
    for (const f of factures) set.add(f.date.slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [factures]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = factures.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    if (filter !== 'all') list = list.filter((f) => f.statut === filter);
    if (pays) {
      list = list.filter((f) => {
        const cl = clients.find((c) => c.id === f.cid);
        return cl?.pays === pays;
      });
    }
    if (mois) list = list.filter((f) => f.date.slice(0, 7) === mois);
    if (q) {
      list = list.filter((f) => {
        const cl = clients.find((c) => c.id === f.cid);
        const prods = (f.lignes || []).map((l) => l.produit).join(' ').toLowerCase();
        return (
          cl?.nom.toLowerCase().includes(q) ||
          f.num.toLowerCase().includes(q) ||
          prods.includes(q)
        );
      });
    }
    return list;
  }, [factures, clients, filter, pays, mois, search]);

  const totals = useMemo(() => {
    const totF = factures.reduce((s, f) => s + totalFacture(f), 0);
    const paye = factures
      .filter((f) => f.statut === 'payee')
      .reduce((s, f) => s + totalFacture(f), 0);
    const imp = factures
      .filter((f) => f.statut === 'impayee')
      .reduce((s, f) => s + totalFacture(f), 0);
    return { totF, paye, imp };
  }, [factures]);

  async function changeStatut(id: string, statut: Statut) {
    const f = factures.find((x) => x.id === id);
    if (!f) return;
    try {
      await api.changeStatut(id, statut);
      upsertFacture({ ...f, statut });
    } catch {
      showToast('Erreur', 'error');
    }
  }

  async function delFac(id: string) {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await api.deleteFacture(id);
      removeFacture(id);
      showToast('Document supprimé');
    } catch {
      showToast('Erreur', 'error');
    }
  }

  async function quickPDF(id: string) {
    const f = factures.find((x) => x.id === id);
    const cl = f ? clients.find((c) => c.id === f.cid) : undefined;
    if (!f || !cl) return;
    try {
      await downloadFacturePDF(f, cl, settings);
    } catch {
      showToast('Erreur PDF', 'error');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          Factures & Devis <span>({filtered.length})</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn" href={csvUrl(mois || undefined)}>
            ⬇ Export CSV
          </a>
          <button className="btn btn-gold" onClick={() => setShowNew(true)}>
            + Nouveau document
          </button>
        </div>
      </div>

      <div className="grid-3">
        <div className="metric">
          <div className="metric-label">Total facturé</div>
          <div className="metric-value">{fmtEUR0(totals.totF)}</div>
          <div className="metric-sub">{factures.length} documents</div>
        </div>
        <div className="metric">
          <div className="metric-label">Encaissé</div>
          <div className="metric-value" style={{ color: 'var(--green)' }}>
            {fmtEUR0(totals.paye)}
          </div>
          <div className="metric-sub">
            {factures.filter((f) => f.statut === 'payee').length} payées
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">⚠️ Impayé</div>
          <div className="metric-value" style={{ color: 'var(--red)' }}>
            {fmtEUR0(totals.imp)}
          </div>
          <div className="metric-sub">
            {factures.filter((f) => f.statut === 'impayee').length} facture(s)
          </div>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="Rechercher (client, produit, n°)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={mois} onChange={(e) => setMois(e.target.value)}>
          <option value="">Tous les mois</option>
          {moisList.map((m) => {
            const [y, mo] = m.split('-');
            return (
              <option key={m} value={m}>
                {MOIS_LBL[parseInt(mo, 10) - 1]} {y}
              </option>
            );
          })}
        </select>
        <select value={pays} onChange={(e) => setPays(e.target.value)}>
          <option value="">Tous les pays</option>
          {paysList.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="tabs">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            className={'tab' + (filter === f.v ? ' active' : '')}
            onClick={() => setFilter(f.v)}
          >
            {f.lbl}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>N°</th>
                <th>Client</th>
                <th>Date</th>
                <th>Produits</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">Aucun document</div>
                  </td>
                </tr>
              )}
              {filtered.map((f) => {
                const cl = clients.find((c) => c.id === f.cid);
                const prods = (f.lignes || []).map((l) => `${l.qte ? l.qte + ' ' : ''}${l.produit}`).join(', ');
                return (
                  <tr key={f.id}>
                    <td>
                      <TypePill t={f.type} />
                    </td>
                    <td>
                      <span className="code">{f.num}</span>
                    </td>
                    <td>
                      <strong>{cl?.nom || '—'}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{cl?.pays}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtDate(f.date)}</td>
                    <td
                      style={{
                        fontSize: 11,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text2)'
                      }}
                      title={prods}
                    >
                      {prods}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--gold)' }}>{fmtEUR(totalFacture(f))}</strong>
                    </td>
                    <td>
                      <StatutBadge s={f.statut} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <select
                          className="status-select"
                          value={f.statut}
                          onChange={(e) => changeStatut(f.id, e.target.value as Statut)}
                        >
                          <option value="devis">Devis</option>
                          <option value="envoyee">Envoyée</option>
                          <option value="payee">Payée</option>
                          <option value="impayee">⚠️ Impayée</option>
                          <option value="annulee">Annulée</option>
                        </select>
                        <button className="btn btn-sm" onClick={() => setEditId(f.id)}>✏️</button>
                        <button className="btn btn-sm" onClick={() => setPreviewId(f.id)}>👁 PDF</button>
                        <button className="btn btn-sm" onClick={() => quickPDF(f.id)} title="Téléchargement direct">⬇</button>
                        <button className="btn btn-sm btn-danger" onClick={() => delFac(f.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <FactureModal factureId={null} onClose={() => setShowNew(false)} />}
      {editId && <FactureModal factureId={editId} onClose={() => setEditId(null)} />}
      {previewId && <FacturePreview factureId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
}
