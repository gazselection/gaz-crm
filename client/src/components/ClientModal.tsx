import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { api } from '../api';
import type { Client, ClientStatut } from '../types';

interface Props {
  client: Client | null;
  onClose: () => void;
  onSaved?: (c: Client) => void;
}

const PAYS = ['France', 'Royaume-Uni', 'Espagne', 'Italie', 'Allemagne', 'Belgique', 'Croatie', 'Pays-Bas', 'Portugal', 'Suisse', 'Autre'];
const STATUTS: ClientStatut[] = ['actif', 'prospect', 'echantillon'];

export function ClientModal({ client, onClose, onSaved }: Props) {
  const upsertClient = useStore((s) => s.upsertClient);
  const showToast = useStore((s) => s.showToast);
  const [form, setForm] = useState<Partial<Client>>(
    client || {
      nom: '',
      contact: '',
      email: '',
      tel: '',
      adresse: '',
      pays: 'France',
      statut: 'prospect',
      remise: 0,
      notes: ''
    }
  );

  useEffect(() => {
    setForm(
      client || {
        nom: '',
        contact: '',
        email: '',
        tel: '',
        adresse: '',
        pays: 'France',
        statut: 'prospect',
        remise: 0,
        notes: ''
      }
    );
  }, [client]);

  function set<K extends keyof Client>(k: K, v: Client[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.nom?.trim()) {
      showToast('Nom requis', 'error');
      return;
    }
    try {
      const saved = client
        ? await api.updateClient(client.id, form)
        : await api.createClient(form);
      upsertClient(saved);
      showToast('Client enregistré');
      onSaved?.(saved);
      onClose();
    } catch {
      showToast('Erreur de sauvegarde', 'error');
    }
  }

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{client ? 'Modifier client' : 'Nouveau client'}</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nom *</label>
            <input value={form.nom || ''} onChange={(e) => set('nom', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact</label>
              <input value={form.contact || ''} onChange={(e) => set('contact', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input value={form.tel || ''} onChange={(e) => set('tel', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pays</label>
              <select value={form.pays || 'France'} onChange={(e) => set('pays', e.target.value)}>
                {PAYS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input value={form.adresse || ''} onChange={(e) => set('adresse', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select value={form.statut || 'prospect'} onChange={(e) => set('statut', e.target.value as ClientStatut)}>
                {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Remise habituelle (%)</label>
              <input type="number" value={form.remise || 0} onChange={(e) => set('remise', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
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
