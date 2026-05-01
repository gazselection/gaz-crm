export type Statut = 'devis' | 'envoyee' | 'payee' | 'impayee' | 'annulee';
export type Paiement = 'virement' | 'wallet' | 'especes' | 'cheque';
export type DocType = 'facture' | 'devis';
export type ClientStatut = 'actif' | 'prospect' | 'echantillon';
export type RelanceType = 'appel' | 'sms' | 'email' | 'note' | 'visite';

export interface Ligne {
  produit: string;
  qte: string;
  unite: string;
  prix: number;
}

export interface Relance {
  id: string;
  type: RelanceType;
  texte: string;
  date: string;
}

export interface Client {
  id: string;
  code: string;
  nom: string;
  contact: string;
  email: string;
  tel: string;
  adresse: string;
  pays: string;
  statut: ClientStatut;
  remise: number;
  notes: string;
  relances: Relance[];
}

export interface Facture {
  id: string;
  cid: string;
  num: string;
  date: string;
  type: DocType;
  envoi: number;
  remise: number;
  paiement: Paiement;
  statut: Statut;
  notes: string;
  lignes: Ligne[];
}

export interface Settings {
  nom?: string;
  siret?: string;
  adresse?: string;
  email?: string;
  tel?: string;
  site?: string;
  iban?: string;
  mentions?: string;
}
