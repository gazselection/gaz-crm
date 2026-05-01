import { PDFViewer, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { useStore } from '../store';
import { FacturePDF } from './FacturePDF';

interface Props {
  factureId: string;
  onClose: () => void;
}

function safeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 40);
}

export function FacturePreview({ factureId, onClose }: Props) {
  const facture = useStore((s) => s.factures.find((f) => f.id === factureId));
  const client = useStore((s) =>
    facture ? s.clients.find((c) => c.id === facture.cid) : undefined
  );
  const settings = useStore((s) => s.settings);

  if (!facture || !client) {
    return (
      <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Document introuvable</div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>Document ou client introuvable.</p>
          </div>
        </div>
      </div>
    );
  }

  const filename = `${facture.num}_${safeFilename(client.nom)}.pdf`;
  const doc = <FacturePDF facture={facture} client={client} settings={settings} />;

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal lg">
        <div className="modal-header">
          <div className="modal-title">
            Aperçu — <span className="code">{facture.num}</span> · {client.nom}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <PDFViewer style={{ width: '100%', height: '70vh', border: 0 }} showToolbar={false}>
            {doc}
          </PDFViewer>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Fermer</button>
          <PDFDownloadLink document={doc} fileName={filename}>
            {({ loading }) => (
              <button className="btn btn-gold" disabled={loading}>
                {loading ? 'Préparation…' : '⬇ Télécharger PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}

// Téléchargement direct (sans aperçu)
export async function downloadFacturePDF(
  facture: import('../types').Facture,
  client: import('../types').Client,
  settings: import('../types').Settings
) {
  const blob = await pdf(<FacturePDF facture={facture} client={client} settings={settings} />).toBlob();
  const filename = `${facture.num}_${safeFilename(client.nom)}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
