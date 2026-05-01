import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { api, csvUrl } from '../api';
import type { Settings } from '../types';

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const showToast = useStore((s) => s.showToast);
  const factures = useStore((s) => s.factures);

  const [form, setForm] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const moisList = Array.from(new Set(factures.map((f) => f.date.slice(0, 7))))
    .sort()
    .reverse();

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.saveSettings(form);
      setSettings(form);
      showToast('Paramètres enregistrés');
    } catch {
      showToast('Erreur', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Paramètres</div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Informations entreprise</div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nom commercial</label>
              <input value={form.nom || ''} onChange={(e) => set('nom', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">SIRET</label>
              <input value={form.siret || ''} onChange={(e) => set('siret', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input value={form.adresse || ''} onChange={(e) => set('adresse', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input value={form.email || ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input value={form.tel || ''} onChange={(e) => set('tel', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Site web</label>
            <input value={form.site || ''} onChange={(e) => set('site', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IBAN</label>
            <input value={form.iban || ''} onChange={(e) => set('iban', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Mentions légales (bas de facture)</label>
            <textarea
              value={form.mentions || ''}
              onChange={(e) => set('mentions', e.target.value)}
              rows={2}
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <button className="btn btn-gold" onClick={save} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Export CSV — déclaration URSSAF</div>
        </div>
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Exporte toutes les factures du mois choisi (Date, Numéro, Client, Pays, Produits, Montant, Statut).
            Le fichier s'ouvre directement dans Excel ou Google Sheets.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a className="btn btn-gold" href={csvUrl()}>
              ⬇ Tout exporter
            </a>
            {moisList.map((m) => {
              const [y, mo] = m.split('-');
              const lbl = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][
                parseInt(mo, 10) - 1
              ];
              return (
                <a key={m} className="btn" href={csvUrl(m)}>
                  {lbl} {y}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Base de données</div>
        </div>
        <div className="card-body" style={{ fontSize: 13, color: 'var(--text2)' }}>
          <p>
            Les données sont stockées dans le fichier <code>gaz.db</code> à la racine du projet.
            Pour sauvegarder, copie ce fichier sur un disque externe ou un cloud.
          </p>
        </div>
      </div>
    </div>
  );
}
