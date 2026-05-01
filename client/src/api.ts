import type { Client, Facture, Relance, Settings, Statut } from './types';

const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  // Clients
  listClients: () => http<Client[]>('/clients'),
  createClient: (c: Partial<Client>) =>
    http<Client>('/clients', { method: 'POST', body: JSON.stringify(c) }),
  updateClient: (id: string, c: Partial<Client>) =>
    http<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteClient: (id: string) =>
    http<{ ok: boolean }>(`/clients/${id}`, { method: 'DELETE' }),
  addRelance: (id: string, r: Omit<Relance, 'id'>) =>
    http<Relance>(`/clients/${id}/relances`, { method: 'POST', body: JSON.stringify(r) }),
  deleteRelance: (id: string, rid: string) =>
    http<{ ok: boolean }>(`/clients/${id}/relances/${rid}`, { method: 'DELETE' }),

  // Factures
  listFactures: () => http<Facture[]>('/factures'),
  createFacture: (f: Partial<Facture>) =>
    http<Facture>('/factures', { method: 'POST', body: JSON.stringify(f) }),
  updateFacture: (id: string, f: Partial<Facture>) =>
    http<Facture>(`/factures/${id}`, { method: 'PUT', body: JSON.stringify(f) }),
  changeStatut: (id: string, statut: Statut) =>
    http<{ ok: boolean }>(`/factures/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut })
    }),
  deleteFacture: (id: string) =>
    http<{ ok: boolean }>(`/factures/${id}`, { method: 'DELETE' }),
  nextNum: (type: 'facture' | 'devis', date: string) =>
    http<{ num: string }>(`/factures/util/next-num?type=${type}&date=${date}`),

  // Settings
  getSettings: () => http<Settings>('/settings'),
  saveSettings: (s: Settings) =>
    http<{ ok: boolean }>('/settings', { method: 'PUT', body: JSON.stringify(s) })
};

export function csvUrl(mois?: string) {
  return mois ? `${BASE}/export/csv?mois=${mois}` : `${BASE}/export/csv`;
}
