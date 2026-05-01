import { useMemo } from 'react';
import { useStore } from '../store';
import { totalFacture, fmtEUR, fmtEUR0, initials } from '../lib/totals';
import { computeUrssaf, colorForPct, SEUIL_TVA, SEUIL_AE } from '../lib/urssaf';
import { StatutBadge } from '../components/Badge';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function Dashboard() {
  const { clients, factures, settings } = useStore();
  const now = new Date();

  const stats = useMemo(() => {
    const paid = factures.filter((f) => f.statut === 'payee');
    const unpaid = factures.filter((f) => f.statut === 'impayee');
    const pending = factures.filter((f) => f.statut === 'envoyee');
    const totalCA = paid.reduce((s, f) => s + totalFacture(f), 0);
    const thisM = paid.filter((f) => {
      const d = new Date(f.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const caM = thisM.reduce((s, f) => s + totalFacture(f), 0);
    const caAttente = pending.reduce((s, f) => s + totalFacture(f), 0);
    const caImpaye = unpaid.reduce((s, f) => s + totalFacture(f), 0);

    // Top 6 clients par CA payé
    const byC: Record<string, number> = {};
    for (const f of paid) byC[f.cid] = (byC[f.cid] || 0) + totalFacture(f);
    const top = Object.entries(byC)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cid, val]) => ({
        cid,
        val,
        client: clients.find((c) => c.id === cid)
      }));

    // CA 6 derniers mois
    const byM: Record<string, number> = {};
    for (const f of paid) {
      const d = new Date(f.date);
      const k = d.getFullYear() + '-' + d.getMonth();
      byM[k] = (byM[k] || 0) + totalFacture(f);
    }
    const months: { k: string; label: string; val: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.getFullYear() + '-' + d.getMonth();
      months.push({ k, label: MOIS[d.getMonth()], val: byM[k] || 0 });
    }
    const maxV = Math.max(...months.map((m) => m.val), 1);

    // Pending list
    const pendingList = factures
      .filter((f) => ['envoyee', 'impayee'].includes(f.statut))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(0, 6);

    // À relancer (clients avec impayé ou échantillon, dernière relance > 30j)
    const relanceTargets: { client: typeof clients[number]; lastDays: number | null; reason: string }[] = [];
    const today = now.getTime();
    for (const c of clients) {
      const hasUnpaid = factures.some((f) => f.cid === c.id && f.statut === 'impayee');
      const isEchant = c.statut === 'echantillon';
      if (!hasUnpaid && !isEchant) continue;
      const last = c.relances
        .map((r) => new Date(r.date).getTime())
        .sort((a, b) => b - a)[0];
      const days = last ? Math.floor((today - last) / 86400000) : null;
      if (days === null || days > 30) {
        relanceTargets.push({
          client: c,
          lastDays: days,
          reason: hasUnpaid ? 'Impayé' : 'Échantillon'
        });
      }
    }

    return {
      totalCA,
      caM,
      caAttente,
      caImpaye,
      paid,
      pending,
      unpaid,
      thisM,
      top,
      maxTopVal: top[0]?.val || 1,
      months,
      maxV,
      pendingList,
      relanceTargets: relanceTargets.slice(0, 8),
      unpaidList: unpaid
    };
  }, [factures, clients, now.getMonth(), now.getFullYear()]);

  const urssaf = useMemo(() => computeUrssaf(factures, now), [factures]);

  const colTVA = colorForPct(urssaf.pctTVA);
  const colAE = colorForPct(urssaf.pctAE);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">
            Bonjour, <span>{settings.nom || 'Gaz Sélection'}</span> 👋
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            {now.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid-4">
        <div className="metric">
          <div className="metric-label">CA encaissé</div>
          <div className="metric-value">{fmtEUR0(stats.totalCA)}</div>
          <div className="metric-sub">{stats.paid.length} payées</div>
        </div>
        <div className="metric">
          <div className="metric-label">CA ce mois</div>
          <div className="metric-value">{fmtEUR0(stats.caM)}</div>
          <div className="metric-sub">{stats.thisM.length} factures</div>
        </div>
        <div className="metric">
          <div className="metric-label">À encaisser</div>
          <div className="metric-value" style={{ color: 'var(--amber)' }}>
            {fmtEUR0(stats.caAttente)}
          </div>
          <div className="metric-sub">{stats.pending.length} envoyées</div>
        </div>
        <div className="metric">
          <div className="metric-label">⚠️ Impayés</div>
          <div className="metric-value" style={{ color: 'var(--red)' }}>
            {fmtEUR0(stats.caImpaye)}
          </div>
          <div className="metric-sub">{stats.unpaid.length} facture(s)</div>
        </div>
      </div>

      {/* URSSAF + Seuils */}
      <div className="grid-2">
        <div className="urssaf-box">
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 4
              }}
            >
              CA {urssaf.prevMonthLabel} (base de calcul)
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold-light)' }}>
              {fmtEUR(urssaf.caPrevMonth)}
            </div>
          </div>
          <div
            style={{
              background: 'var(--dark2)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Cotisation URSSAF (12,3%)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)' }}>
                {fmtEUR(urssaf.cotisation)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                À payer avant le 31 {urssaf.curMonthLabel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Revenu imposable</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
                {fmtEUR(urssaf.revenuImposable)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                (29% après abattement 71%)
              </div>
            </div>
          </div>
        </div>

        <div className="urssaf-box">
          <div style={{ marginBottom: 14 }}>
            <div className="urssaf-row">
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Seuil TVA ({fmtEUR0(SEUIL_TVA)})</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colTVA }}>
                {fmtEUR0(urssaf.caCumul)} / {urssaf.pctTVA}%
              </span>
            </div>
            <div className="seuil-bar">
              <div className="seuil-fill" style={{ width: urssaf.pctTVA + '%', background: colTVA }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
              {fmtEUR0(urssaf.resteTVA)} restant avant obligation TVA
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="urssaf-row">
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Seuil AE ({fmtEUR0(SEUIL_AE)})</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: colAE }}>{urssaf.pctAE}%</span>
            </div>
            <div className="seuil-bar">
              <div className="seuil-fill" style={{ width: urssaf.pctAE + '%', background: colAE }} />
            </div>
          </div>
          <div
            style={{
              background: 'var(--dark2)',
              borderRadius: 7,
              padding: '10px 12px',
              border: '1px solid var(--border)',
              fontSize: 12
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text3)' }}>CA cumulé {urssaf.curYear}</span>
              <strong>{fmtEUR0(urssaf.caCumul)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: 'var(--text3)' }}>Projection annuelle</span>
              <strong style={{ color: urssaf.projAnnuelle > SEUIL_TVA ? 'var(--amber)' : 'var(--green)' }}>
                {fmtEUR0(urssaf.projAnnuelle)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes impayés */}
      {stats.unpaidList.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ Alertes impayés</div>
          </div>
          <div className="card-body">
            {stats.unpaidList.map((inv) => {
              const cl = clients.find((c) => c.id === inv.cid);
              return (
                <div className="alert-bar" key={inv.id}>
                  ⚠️ <strong>{cl?.nom || '?'}</strong> — {fmtEUR(totalFacture(inv))} impayé ({inv.num})
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart + top */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">CA encaissé — 6 derniers mois</div>
          </div>
          <div className="card-body">
            {stats.months.map((m) => (
              <div className="bar-row" key={m.k}>
                <span className="bar-label">{m.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: Math.round((m.val / stats.maxV) * 100) + '%' }} />
                </div>
                <span className="bar-val">{m.val ? fmtEUR0(m.val) : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Top 6 clients par CA</div>
          </div>
          <div className="card-body">
            {stats.top.length === 0 && <div className="empty">Aucune donnée</div>}
            {stats.top.map((t) => (
              <div className="bar-row" key={t.cid}>
                <span className="bar-label" title={t.client?.nom}>
                  {t.client?.nom.split(' ')[0] || '?'}
                </span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: Math.round((t.val / stats.maxTopVal) * 100) + '%', background: 'var(--gold)' }}
                  />
                </div>
                <span className="bar-val">{fmtEUR0(t.val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* À relancer + En attente */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📞 À relancer</div>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {stats.relanceTargets.length} client(s)
            </span>
          </div>
          <div className="card-body">
            {stats.relanceTargets.length === 0 && (
              <div className="empty">Aucun client à relancer 👌</div>
            )}
            {stats.relanceTargets.map(({ client, lastDays, reason }) => (
              <div
                key={client.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div className="avatar">{initials(client.nom)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{client.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {reason} •{' '}
                    {lastDays === null
                      ? 'Jamais relancé'
                      : `Dernière relance il y a ${lastDays} j`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 En attente</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.pendingList.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty">Aucune en attente</div>
                    </td>
                  </tr>
                )}
                {stats.pendingList.map((f) => {
                  const cl = clients.find((c) => c.id === f.cid);
                  return (
                    <tr key={f.id}>
                      <td>
                        <span className="code">{f.num}</span>
                      </td>
                      <td>{cl?.nom || '—'}</td>
                      <td>
                        <strong>{fmtEUR(totalFacture(f))}</strong>
                      </td>
                      <td>
                        <StatutBadge s={f.statut} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
