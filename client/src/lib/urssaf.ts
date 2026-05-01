import type { Facture } from '../types';
import { totalFacture } from './totals';

export const TAUX_URSSAF = 0.123;
export const SEUIL_TVA = 91900;
export const SEUIL_AE = 188700;

export interface UrssafStats {
  caPrevMonth: number;
  cotisation: number;
  revenuImposable: number;
  caCumul: number;
  projAnnuelle: number;
  pctTVA: number;
  pctAE: number;
  resteTVA: number;
  resteAE: number;
  prevMonthLabel: string;
  curMonthLabel: string;
  curYear: number;
}

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function caForMonth(factures: Facture[], year: number, month: number): number {
  return factures
    .filter((f) => {
      if (f.statut !== 'payee') return false;
      const d = new Date(f.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((s, f) => s + totalFacture(f), 0);
}

export function computeUrssaf(factures: Facture[], now = new Date()): UrssafStats {
  const yr = now.getFullYear();
  const cur = now.getMonth();
  const prevM = cur === 0 ? 11 : cur - 1;
  const prevY = cur === 0 ? yr - 1 : yr;

  const caPrevMonth = caForMonth(factures, prevY, prevM);
  const cotisation = caPrevMonth * TAUX_URSSAF;
  const revenuImposable = caPrevMonth * 0.29;

  let caCumul = 0;
  for (let m = 0; m <= cur; m++) caCumul += caForMonth(factures, yr, m);

  const monthsDone = cur + 1;
  const projAnnuelle = monthsDone > 0 ? (caCumul / monthsDone) * 12 : caCumul;

  const pctTVA = Math.min(100, Math.round((caCumul / SEUIL_TVA) * 100));
  const pctAE = Math.min(100, Math.round((caCumul / SEUIL_AE) * 100));

  return {
    caPrevMonth,
    cotisation,
    revenuImposable,
    caCumul,
    projAnnuelle,
    pctTVA,
    pctAE,
    resteTVA: Math.max(0, SEUIL_TVA - caCumul),
    resteAE: Math.max(0, SEUIL_AE - caCumul),
    prevMonthLabel: `${MOIS[prevM]} ${prevY}`,
    curMonthLabel: MOIS[cur],
    curYear: yr
  };
}

export function colorForPct(p: number): string {
  if (p > 80) return 'var(--red)';
  if (p > 60) return 'var(--amber)';
  return 'var(--green)';
}
