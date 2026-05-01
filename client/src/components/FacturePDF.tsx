import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Facture, Client, Settings } from '../types';
import { totalFacture } from '../lib/totals';

interface Props {
  facture: Facture;
  client: Client;
  settings: Settings;
}

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  payee: { label: 'PAYÉE', color: '#2ECC71' },
  envoyee: { label: 'ENVOYÉE', color: '#3498DB' },
  devis: { label: 'DEVIS', color: '#F39C12' },
  impayee: { label: 'IMPAYÉE', color: '#E74C3C' },
  annulee: { label: 'ANNULÉE', color: '#707070' }
};

const PAIEMENT_LABELS: Record<string, string> = {
  virement: 'Virement bancaire',
  wallet: 'Vivawallet',
  especes: 'Espèces',
  cheque: 'Chèque'
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, alignItems: 'flex-start' },
  logo: { width: 70, height: 70, objectFit: 'contain' },
  titleBox: { textAlign: 'right' },
  title: { fontSize: 22, fontWeight: 700, color: '#D4A017', marginBottom: 2 },
  num: { fontSize: 13, color: '#444', marginBottom: 6 },
  statusPill: {
    fontSize: 9,
    fontWeight: 700,
    padding: '3 8',
    borderRadius: 12,
    color: '#fff',
    alignSelf: 'flex-end'
  },
  blocks: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  block: { flex: 1, padding: 10, border: '1pt solid #eaeaea', borderRadius: 6 },
  blockTitle: { fontSize: 8, color: '#888', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.6 },
  blockBody: { fontSize: 10, lineHeight: 1.5 },
  table: { width: '100%', marginBottom: 10 },
  thead: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderBottom: '1pt solid #ddd', padding: 6 },
  th: { fontSize: 9, fontWeight: 700, color: '#444', textTransform: 'uppercase' },
  trow: { flexDirection: 'row', borderBottom: '0.5pt solid #eee', padding: '6 6' },
  td: { fontSize: 10 },
  totalsBox: { marginTop: 6, marginLeft: 'auto', width: 220, padding: 10, backgroundColor: '#faf5e6', borderRadius: 6, border: '1pt solid #D4A017' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  totalLabel: { fontSize: 9, color: '#666' },
  totalValue: { fontSize: 10, fontWeight: 700 },
  grandTotal: { borderTop: '1pt solid #D4A017', marginTop: 6, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  grandLabel: { fontSize: 11, fontWeight: 700, color: '#D4A017' },
  grandValue: { fontSize: 13, fontWeight: 700, color: '#D4A017' },
  footer: { marginTop: 20, fontSize: 8, color: '#888', borderTop: '1pt solid #eee', paddingTop: 8 },
  notes: { marginTop: 10, fontSize: 9, fontStyle: 'italic', color: '#666' }
});

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(n);
}
function fmtDate(d: string) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

export function FacturePDF({ facture, client, settings }: Props) {
  const sumLignes = facture.lignes.reduce((s, l) => s + Number(l.prix || 0), 0);
  const totalHT = totalFacture(facture);
  const status = STATUT_LABELS[facture.statut] || { label: facture.statut.toUpperCase(), color: '#888' };
  const isDevis = facture.type === 'devis';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="/gaz-logo.png" style={styles.logo} />
          <View style={styles.titleBox}>
            <Text style={styles.title}>{isDevis ? 'DEVIS' : 'FACTURE'}</Text>
            <Text style={styles.num}>N° {facture.num}</Text>
            <Text style={{ fontSize: 10, color: '#666' }}>Date : {fmtDate(facture.date)}</Text>
            <View style={{ marginTop: 6, alignItems: 'flex-end' }}>
              <Text style={[styles.statusPill, { backgroundColor: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        <View style={styles.blocks}>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Émetteur</Text>
            <View style={styles.blockBody}>
              <Text style={{ fontWeight: 700 }}>{settings.nom || 'Gaz Sélection CBD'}</Text>
              {settings.adresse && <Text>{settings.adresse}</Text>}
              {settings.email && <Text>{settings.email}</Text>}
              {settings.tel && <Text>{settings.tel}</Text>}
              {settings.siret && <Text>SIRET : {settings.siret}</Text>}
            </View>
          </View>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Client</Text>
            <View style={styles.blockBody}>
              <Text style={{ fontWeight: 700 }}>{client.nom}</Text>
              {client.contact && <Text>{client.contact}</Text>}
              {client.adresse && <Text>{client.adresse}</Text>}
              {client.pays && <Text>{client.pays}</Text>}
              {client.email && <Text>{client.email}</Text>}
              <Text style={{ marginTop: 3, color: '#888' }}>Code : {client.code}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.thead}>
            <Text style={[styles.th, { flex: 4 }]}>Désignation</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Qté</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Unité</Text>
            <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Total</Text>
          </View>
          {facture.lignes.map((l, i) => (
            <View key={i} style={styles.trow}>
              <Text style={[styles.td, { flex: 4 }]}>{l.produit || '—'}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{l.qte || ''}</Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{l.unite || ''}</Text>
              <Text style={[styles.td, { flex: 1.4, textAlign: 'right' }]}>{fmt(Number(l.prix || 0))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{fmt(sumLignes)}</Text>
          </View>
          {Number(facture.envoi) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frais d'envoi</Text>
              <Text style={styles.totalValue}>{fmt(Number(facture.envoi))}</Text>
            </View>
          )}
          {Number(facture.remise) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Remise</Text>
              <Text style={styles.totalValue}>−{Number(facture.remise)}%</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandLabel}>Total TTC</Text>
            <Text style={styles.grandValue}>{fmt(totalHT)}</Text>
          </View>
        </View>

        {facture.notes && <Text style={styles.notes}>Note : {facture.notes}</Text>}

        <View style={styles.footer}>
          <Text style={{ marginBottom: 4 }}>
            <Text style={{ fontWeight: 700 }}>Mode de paiement :</Text>{' '}
            {PAIEMENT_LABELS[facture.paiement] || facture.paiement}
            {settings.iban ? `   •   IBAN : ${settings.iban}` : ''}
          </Text>
          <Text>{settings.mentions || 'Auto-entrepreneur — Dispensé de TVA, art. 293 B du CGI.'}</Text>
          {settings.site && <Text style={{ marginTop: 2 }}>{settings.site}</Text>}
        </View>
      </Page>
    </Document>
  );
}
