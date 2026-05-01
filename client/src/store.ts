import { create } from 'zustand';
import { api } from './api';
import type { Client, Facture, Settings } from './types';

interface State {
  clients: Client[];
  factures: Facture[];
  settings: Settings;
  loaded: boolean;
  toast: { msg: string; kind: 'success' | 'error' } | null;
  load: () => Promise<void>;
  setClients: (c: Client[]) => void;
  setFactures: (f: Facture[]) => void;
  setSettings: (s: Settings) => void;
  upsertClient: (c: Client) => void;
  removeClient: (id: string) => void;
  upsertFacture: (f: Facture) => void;
  removeFacture: (id: string) => void;
  showToast: (msg: string, kind?: 'success' | 'error') => void;
  clearToast: () => void;
}

export const useStore = create<State>((set, get) => ({
  clients: [],
  factures: [],
  settings: {},
  loaded: false,
  toast: null,

  load: async () => {
    const [clients, factures, settings] = await Promise.all([
      api.listClients(),
      api.listFactures(),
      api.getSettings()
    ]);
    set({ clients, factures, settings, loaded: true });
  },

  setClients: (clients) => set({ clients }),
  setFactures: (factures) => set({ factures }),
  setSettings: (settings) => set({ settings }),

  upsertClient: (c) => {
    const list = get().clients.slice();
    const i = list.findIndex((x) => x.id === c.id);
    if (i >= 0) list[i] = c;
    else list.push(c);
    list.sort((a, b) => a.code.localeCompare(b.code));
    set({ clients: list });
  },
  removeClient: (id) => set({ clients: get().clients.filter((c) => c.id !== id) }),

  upsertFacture: (f) => {
    const list = get().factures.slice();
    const i = list.findIndex((x) => x.id === f.id);
    if (i >= 0) list[i] = f;
    else list.push(f);
    list.sort((a, b) => (a.date < b.date ? 1 : -1));
    set({ factures: list });
  },
  removeFacture: (id) => set({ factures: get().factures.filter((f) => f.id !== id) }),

  showToast: (msg, kind = 'success') => {
    set({ toast: { msg, kind } });
    setTimeout(() => {
      if (get().toast?.msg === msg) set({ toast: null });
    }, 2500);
  },
  clearToast: () => set({ toast: null })
}));
