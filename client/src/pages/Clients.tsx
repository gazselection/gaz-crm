import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { totalFacture, fmtEUR0, fmtDate, initials } from '../lib/totals';
import { ClientStatutBadge } from '../components/Badge';
import { ClientPanel } from '../components/ClientPanel';
import { ClientModal } from '../components/ClientModal';
import { FactureModal } from '../components/FactureModal';
import { FacturePreview } from '../components/FacturePreview';
import type { Client, ClientStatut } from '../types';

type Filter = 'all' | ClientStatut | 'impaye';

const FILTERS: { v: Filter; lbl: string }[] = [
  { v: 'all', lbl: 'Tous' },
  { v: 'actif', lbl: 'Actifs' },
  { v: 'prospect', lbl: 'Prospects' },
  { v: 'echantillon', lbl: 'Échantillons' },
  { v: 'impaye', lbl: '⚠️ Impayés' }
];

export default function Clients() {
  const clients = useStore((s) => s.clients);
  const factures = useStore((s) => s.factures);

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [pays, setPays] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newFacFor, setNewFacFor] = useState<string | null>(null);
  const [previewFacId, setPreviewFacId] = useState<string | null>(null);

  const paysList = useMemo(
    () => Array.from(new Set(clients.map((c) => c.pays).filter(Boolean))).sort(),
    [clients]
  );

  const list = useMemo(() => {
    const q = search.toLowerCase();
    let f = clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q) ||
        (c.contact || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.pays || '').toLowerCase().includes(q)
    );
    if (filter === 'impaye') {
      const ui = new Set(factures.filter((x) => x.statut === 'impayee').map((x) => x.cid));
      f = f.filter((c) => ui.has(c.id));
    } else if (filter !== 'all') {
      f = f.filter((c) => c.statut === filter);
    }
    if (pays) f = f.filter((c) => c.pays === pays);
    return f;
  }, [clients, factures, search, filter, pays]);

  const openClient = openId ? clients.find((c) => c.id === openId) || null : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          Clients <span>({list.length})</span>
        </div>
        <button className="btn btn-gold" onClick={() => setShowNewClient(true)}>
          + Nouveau client
        </button>
      </div>

      <div className="filters">
        <input
          placeholder="Rechercher (nom, code, email, ville…)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                <th>Code</th>
                <th>Boutique</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Docs</th>
                <th>CA payé</th>
                <th>Dernière</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty">Aucun client</div>
                  </td>
                </tr>
              )}
              {list.map((c) => {
                const fs = factures.filter((f) => f.cid === c.id);
                const ca = fs
                  .filter((f) => f.statut === 'payee')
                  .reduce((s, f) => s + totalFacture(f), 0);
                const hasU = fs.some((f) => f.statut === 'impayee');
                const last = fs.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
                return (
                  <tr key={c.id} className="clickable" onClick={() => setOpenId(c.id)}>
                    <td>
                      <span className="code">{c.code}</span>
                    </td>
                    <td>
                      <div className="flex">
                        <div className="avatar">{initials(c.nom)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {c.nom}
                            {hasU && (
                              <span
                                className="badge b-red"
                                style={{ fontSize: 9, padding: '1px 5px', marginLeft: 6 }}
                              >
                                ⚠️
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.pays}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{c.contact}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.tel}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }}>{c.email}</td>
                    <td>
                      <ClientStatutBadge s={c.statut} />
                    </td>
                    <td style={{ textAlign: 'center' }}>{fs.length}</td>
                    <td>
                      <strong style={{ color: 'var(--gold)' }}>{fmtEUR0(ca)}</strong>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {last ? fmtDate(last.date) : '—'}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-gold"
                        onClick={() => setNewFacFor(c.id)}
                      >
                        + Doc
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {openClient && (
        <ClientPanel
          client={openClient}
          onClose={() => setOpenId(null)}
          onEdit={() => {
            setEditClient(openClient);
            setOpenId(null);
          }}
          onNewFac={() => setNewFacFor(openClient.id)}
          onOpenFacture={(id) => setPreviewFacId(id)}
        />
      )}

      {showNewClient && (
        <ClientModal client={null} onClose={() => setShowNewClient(false)} />
      )}
      {editClient && (
        <ClientModal client={editClient} onClose={() => setEditClient(null)} />
      )}

      {newFacFor && (
        <FactureModal
          factureId={null}
          presetClientId={newFacFor}
          onClose={() => setNewFacFor(null)}
        />
      )}

      {previewFacId && (
        <FacturePreview factureId={previewFacId} onClose={() => setPreviewFacId(null)} />
      )}
    </div>
  );
}
