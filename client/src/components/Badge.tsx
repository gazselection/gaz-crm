import type { Statut, ClientStatut } from '../types';

const FAC_LABELS: Record<Statut, [string, string]> = {
  payee: ['Payée', 'b-green'],
  envoyee: ['Envoyée', 'b-blue'],
  devis: ['Devis', 'b-amber'],
  impayee: ['⚠️ Impayée', 'b-red'],
  annulee: ['Annulée', 'b-gray']
};

const CLIENT_LABELS: Record<ClientStatut, [string, string]> = {
  actif: ['Actif', 'b-green'],
  prospect: ['Prospect', 'b-blue'],
  echantillon: ['Échantillon', 'b-amber']
};

export function StatutBadge({ s }: { s: Statut }) {
  const [label, cls] = FAC_LABELS[s] || ['?', 'b-gray'];
  return <span className={'badge ' + cls}>{label}</span>;
}

export function ClientStatutBadge({ s }: { s: ClientStatut }) {
  const [label, cls] = CLIENT_LABELS[s] || ['?', 'b-gray'];
  return <span className={'badge ' + cls}>{label}</span>;
}

export function TypePill({ t }: { t: 'facture' | 'devis' }) {
  return <span className={'type-pill ' + (t === 'devis' ? 't-dev' : 't-fac')}>{t === 'devis' ? 'Devis' : 'Facture'}</span>;
}
