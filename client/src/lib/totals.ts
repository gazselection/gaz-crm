import type { Facture } from '../types';

export function totalFacture(f: Facture): number {
  const sumLignes = (f.lignes || []).reduce((s, l) => s + Number(l.prix || 0), 0);
  const envoi = Number(f.envoi || 0);
  const remise = Number(f.remise || 0);
  return (sumLignes + envoi) * (1 - remise / 100);
}

export function fmtEUR(n: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);
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
