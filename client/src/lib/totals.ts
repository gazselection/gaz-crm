import type { Facture } from '../types';

export function totalFacture(f: Facture): number {
  const sumLignes = (f.lignes || []).reduce((s, l) => s + Number(l.prix || 0), 0);
  const envoi = Number(f.envoi || 0);
  const remise = Number(f.remise || 0);
  return (sumLignes + envoi) * (1 - remise / 100);
}

export function fmtEUR(n: number, decimals = 2): string {
  const val = isNaN(n) ? 0 : n;
  const fixed = val.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return intFormatted + ',' + decPart + ' €';
}

export const fmtEUR0 = (n: number) => fmtEUR(n, 0);

export function fmtDate(d: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fr-FR');
  } catch {
    return d;
  }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
