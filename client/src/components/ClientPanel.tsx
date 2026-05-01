import { useState } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import { fmtEUR, fmtEUR0, fmtDate, totalFacture, initials } from '../lib/totals';
import { StatutBadge, ClientStatutBadge, TypePill } from './Badge';
import type { Client, RelanceType } from '../types';

interface Props {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  onNewFac: () => void;
  onOpenFacture: (id: string) => void;
}

const RTYPES: { t: RelanceType; lbl: string; icon: string }[] = [
  { t: 'appel', lbl: 'Appel', icon: '📞' },
  { t: 'sms', lbl: 'SMS', icon: '💬' },
  { t: 'email', lbl: 'Email', icon: '✉️' },
  { t: 'note', lbl: 'Note', icon: '📝' },
  { t: 'visite', lbl: 'Visite', icon: '🤝' }
];

export function ClientPanel({ client, onClose, onEdit, onNewFac, onOpenFacture }: Props) {
  const factures = useStore((s) => s.factures);
  const upsertClient = useStore((s) => s.upsertClient);
  const removeClient = useStore((s) => s.removeClient);
  const showToast = useStore((s) => s.showToast);

  const [showRelance, setShowRelance] = useState(false);
  const [rType, setRType] = useState<RelanceType>('appel');
  const [rText, setRText] = useState('');

  const fs = factures.filter((f) => f.cid === client.id);
  const ca = fs.filter((f) => f.statut === 'payee').reduce((s, f) => s + totalFacture(f), 0);
  const imp = fs.filter((f) => f.statut === 'impayee').reduce((s, f) => s + totalFacture(f), 0);

  async function saveRelance() {
    if (!rText.trim()) return;
    try {
      const r = await api.addRelance(client.id, {
        type: rType,
        texte: rText.trim(),
        date: new Date().toISOString().slice(0, 10)
      });
      const updated: Client = {
        ...client,
        relances: [r, ...client.relances]
      };
      upsertClient(updated);
      setShowRelance(false);
      setRText('');
      showToast('Relance ajoutée');
    } catch (e) {
      showToast('Erreur', 'error');
    }
  }

  async function deleteRelance(rid: string) {
    if (!confirm('Supprimer cette relance ?')) return;
    try {
      await api.deleteRelance(client.id, rid);
      upsertClient({ ...client, relances: client.relances.filter((r) => r.id !== rid) });
    } catch {
      showToast('Erreur', 'error');
    }
  }

  async function deleteClient() {
    if (!confirm(`Supprimer ${client.nom} ? (Toutes ses factures seront supprimées aussi)`)) return;
    try {
      await api.deleteClient(client.id);
      removeClient(client.id);
      // refresh factures
      const list = await api.listFactures();
      useStore.setState({ factures: list });
      showToast('Client supprimé');
      onClose();
    } catch {
      showToast('Erreur', 'error');
    }
  }

  return (
    <>
      <div className="cp-overlay open" onClick={onClose} />
      <div className="cp-panel open">
        <div className="cp-head">
          <div className="flex">
            <div className="avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
              {initials(client.nom)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{client.nom}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                <span className="code">{client.code}</span> • {client.pays}
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="cp-body">
          <div className="cp-metrics">
            <div className="cp-m">
              <div className="cp-mv">{fmtEUR0(ca)}</div>
              <div className="cp-ml">CA payé</div>
            </div>
            <div className="cp-m">
              <div className="cp-mv" style={{ color: imp ? 'var(--red)' : 'var(--gold-light)' }}>
                {fmtEUR0(imp)}
              </div>
              <div className="cp-ml">Impayé</div>
            </div>
            <div className="cp-m">
              <div className="cp-mv">{fs.length}</div>
              <div className="cp-ml">Documents</div>
            </div>
          </div>

          <div className="cp-section">
            <div className="cp-section-title">
              Infos contact <ClientStatutBadge s={client.statut} />
            </div>
            <div className="cp-info">
              {client.contact && (
                <div className="cp-info-row">
                  <span className="cp-info-lbl">Contact</span>
                  <span className="cp-info-val">{client.contact}</span>
                </div>
              )}
              {client.email && (
                <div className="cp-info-row">
                  <span className="cp-info-lbl">Email</span>
                  <span className="cp-info-val">{client.email}</span>
                </div>
              )}
              {client.tel && (
                <div className="cp-info-row">
                  <span className="cp-info-lbl">Tél</span>
                  <span className="cp-info-val">{client.tel}</span>
                </div>
              )}
              {client.adresse && (
                <div className="cp-info-row">
                  <span className="cp-info-lbl">Adresse</span>
                  <span className="cp-info-val">{client.adresse}</span>
                </div>
              )}
              <div className="cp-info-row">
                <span className="cp-info-lbl">Pays</span>
                <span className="cp-info-val">{client.pays}</span>
              </div>
              {client.notes && (
                <div className="cp-info-row">
                  <span className="cp-info-lbl">Notes</span>
                  <span className="cp-info-val">{client.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div className="cp-section">
            <div className="cp-section-title">
              <span>Historique factures</span>
              <button className="btn btn-sm btn-gold" onClick={onNewFac}>
                + Nouveau
              </button>
            </div>
            {fs.length === 0 && <div className="empty">Aucun document</div>}
            {fs
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((f) => (
                <div
                  key={f.id}
                  onClick={() => onOpenFacture(f.id)}
                  style={{
                    background: 'var(--surface2)',
                    borderRadius: 7,
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    marginBottom: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <TypePill t={f.type} />
                    <span className="code">{f.num}</span>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {fmtDate(f.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ color: 'var(--gold-light)' }}>{fmtEUR(totalFacture(f))}</strong>
                    <div style={{ marginTop: 2 }}>
                      <StatutBadge s={f.statut} />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="cp-section">
            <div className="cp-section-title">
              <span>Journal des relances</span>
              <button className="btn btn-sm" onClick={() => setShowRelance((v) => !v)}>
                {showRelance ? 'Annuler' : '+ Ajouter'}
              </button>
            </div>
            {showRelance && (
              <div className="relance-form">
                <div className="r-types">
                  {RTYPES.map((rt) => (
                    <button
                      key={rt.t}
                      type="button"
                      className={'r-type' + (rType === rt.t ? ' active' : '')}
                      onClick={() => setRType(rt.t)}
                    >
                      {rt.icon} {rt.lbl}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Détails…"
                  value={rText}
                  onChange={(e) => setRText(e.target.value)}
                  rows={3}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button className="btn btn-gold btn-sm" onClick={saveRelance}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
            {client.relances.length === 0 && !showRelance && (
              <div className="empty">Aucune relance</div>
            )}
            {client.relances.map((r) => {
              const icon = RTYPES.find((x) => x.t === r.type)?.icon || '📝';
              return (
                <div className="relance-item" key={r.id}>
                  <div className="relance-meta">
                    {icon} {r.type.toUpperCase()} • {fmtDate(r.date)}
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ float: 'right', padding: '2px 6px', fontSize: 10 }}
                      onClick={() => deleteRelance(r.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div>{r.texte}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="btn" onClick={onEdit}>
              ✏️ Modifier
            </button>
            <button className="btn btn-danger" onClick={deleteClient}>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
