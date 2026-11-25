import { useEffect, useState } from 'react';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { Outcome3Report, Outcome3Transaction } from '../../types/admin';

const PAGE_SIZE = 20;
const MIN_REVIEWERS = 10;
const MIN_REVIEW_RATE = 50;

const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}₫`;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function exportTransactionsCsv() {
  const rows: Outcome3Transaction[] = [];
  for (let page = 0; page < 200; page += 1) {
    const chunk = await adminApi.getOutcome3Transactions(page, 500);
    rows.push(...chunk);
    if (chunk.length < 500) break;
  }
  const header = ['paymentId', 'orderId', 'customerId', 'customerName', 'paymentMethod', 'referenceCode',
    'gatewayTransactionId', 'amount', 'refundedAmount', 'status', 'paidAt'];
  const lines = [header.join(',')].concat(
    rows.map((row) =>
      [row.paymentId, row.orderId, row.customerId, row.customerName, row.paymentMethod, row.referenceCode,
        row.gatewayTransactionId, row.amount, row.refundedAmount, row.status, row.paidAt]
        .map(csvCell).join(','))
  );
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stylelock-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className={`o3-check ${ok ? 'ok' : 'bad'}`}>
      <span className="material-symbols-outlined">{ok ? 'check_circle' : 'error'}</span>
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

export function AdminOutcome3() {
  const at = useAdminT();
  const [report, setReport] = useState<Outcome3Report>();
  const [rows, setRows] = useState<Outcome3Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string>();

  const message = (err: unknown) => (err instanceof Error ? err.message : at('genericError'));

  const loadReport = () => {
    setLoading(true);
    setError(undefined);
    adminApi
      .getOutcome3Report()
      .then(setReport)
      .catch((err) => setError(message(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadReport, []);

  useEffect(() => {
    let active = true;
    adminApi
      .getOutcome3Transactions(page, PAGE_SIZE + 1)
      .then((result) => active && setRows(result))
      .catch((err) => active && setError(message(err)));
    return () => {
      active = false;
    };
  }, [page]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTransactionsCsv();
    } catch (err) {
      setError(message(err));
    } finally {
      setExporting(false);
    }
  };

  const hasNext = rows.length > PAGE_SIZE;
  const visibleRows = rows.slice(0, PAGE_SIZE);
  const s = report?.summary;
  const reviewsOk = !!report
    && report.reviews.reviewedPaidCustomers >= MIN_REVIEWERS
    && report.reviews.reviewRatePercent >= MIN_REVIEW_RATE;

  return (
    <div className="admin-stack">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{at('o3Title')}</h3>
            <p>{at('o3Desc')}</p>
          </div>
          <button type="button" className="ghost-button" onClick={loadReport} disabled={loading}>
            {at('o3Refresh')}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {loading && !report && <div className="empty-row">{at('loading')}</div>}

        {report && s && (
          <>
            <div className="o3-kpis">
              <div><span>{at('o3Revenue')}</span><strong>{money(s.netRevenue)}</strong>
                <small>{at('o3RevenueNote', { gross: money(s.grossRevenue), refunded: money(s.refundedAmount) })}</small></div>
              <div><span>{at('o3Users')}</span><strong>{s.totalUsers.toLocaleString()}</strong>
                <small>{at('o3UsersNote', { paid: s.paidCustomers })}</small></div>
              <div><span>{at('o3Transactions')}</span><strong>{s.transactions.toLocaleString()}</strong>
                <small>{at('o3AovNote', { aov: money(s.averageOrderValue) })}</small></div>
              <div><span>{at('o3Reviews')}</span><strong>{s.reviews.toLocaleString()}</strong>
                <small>{at('o3RatingNote', { rating: report.reviews.averageRating })}</small></div>
            </div>

            <h4 className="utm-subtitle">{at('o3Threshold')}</h4>
            {s.transactionThreshold > 0 && s.thresholdProgressPercent !== null ? (
              <div className="o3-progress">
                <div className="o3-bar"><i style={{ width: `${Math.min(100, s.thresholdProgressPercent)}%` }} /></div>
                <span>{at('o3ThresholdValue', {
                  done: s.transactions, total: s.transactionThreshold, percent: s.thresholdProgressPercent
                })}</span>
              </div>
            ) : (
              <p className="utm-hint">{at('o3ThresholdUnset')}</p>
            )}

            <h4 className="utm-subtitle">{at('o3Checks')}</h4>
            <div className="o3-checks">
              <Check
                ok={report.fairness.withinLimit}
                label={at('o3CheckFair')}
                detail={at('o3CheckFairDetail', {
                  share: report.fairness.topCustomerSharePercent,
                  max: report.fairness.maxAllowedSharePercent,
                  tx: report.fairness.topCustomerTransactions
                })}
              />
              <Check
                ok={reviewsOk}
                label={at('o3CheckReviews')}
                detail={at('o3CheckReviewsDetail', {
                  reviewers: report.reviews.reviewedPaidCustomers,
                  min: MIN_REVIEWERS,
                  rate: report.reviews.reviewRatePercent,
                  minRate: MIN_REVIEW_RATE
                })}
              />
              <Check
                ok={report.reviews.repeatCustomers > 0}
                label={at('o3CheckRepeat')}
                detail={at('o3CheckRepeatDetail', {
                  repeat: report.reviews.repeatCustomers,
                  rate: report.reviews.repeatPurchaseRatePercent
                })}
              />
            </div>

            <h4 className="utm-subtitle">{at('o3Channels')}</h4>
            {report.channels.length === 0 ? (
              <div className="empty-row">{at('trEmpty')}</div>
            ) : (
              <div className="o3-table-wrap">
                <table className="o3-table">
                  <thead>
                    <tr>
                      <th>{at('trSource')}</th>
                      <th>{at('trMedium')}</th>
                      <th>{at('trSessions')}</th>
                      <th>{at('o3Signups')}</th>
                      <th>{at('o3PaidCustomers')}</th>
                      <th>{at('o3Transactions')}</th>
                      <th>{at('o3ColRevenue')}</th>
                      <th>{at('o3ConvSignup')}</th>
                      <th>{at('o3ConvVisit')}</th>
                      <th>{at('o3Aov')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.channels.map((row) => (
                      <tr key={`${row.source}|${row.medium}`}>
                        <td><b>{row.source}</b></td>
                        <td>{row.medium}</td>
                        <td>{row.sessions.toLocaleString()}</td>
                        <td>{row.signups.toLocaleString()}</td>
                        <td>{row.paidCustomers.toLocaleString()}</td>
                        <td>{row.transactions.toLocaleString()}</td>
                        <td>{money(row.revenue)}</td>
                        <td>{row.signupToPaidPercent}%</td>
                        <td>{row.visitToPaidPercent}%</td>
                        <td>{money(row.averageOrderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="utm-hint">{at('o3ChannelHint')}</p>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{at('o3TxTitle')}</h3>
            <p>{at('o3TxDesc')}</p>
          </div>
          <button type="button" className="solid-button" onClick={handleExport} disabled={exporting}>
            {exporting ? at('loading') : at('o3Export')}
          </button>
        </div>

        {visibleRows.length === 0 ? (
          <div className="empty-row">{at('o3TxEmpty')}</div>
        ) : (
          <div className="o3-table-wrap">
            <table className="o3-table">
              <thead>
                <tr>
                  <th>{at('o3Order')}</th>
                  <th>{at('o3Customer')}</th>
                  <th>{at('o3Method')}</th>
                  <th>{at('o3Reference')}</th>
                  <th>{at('o3Gateway')}</th>
                  <th>{at('o3Amount')}</th>
                  <th>{at('o3Status')}</th>
                  <th>{at('o3PaidAt')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.paymentId}>
                    <td>#{row.orderId}</td>
                    <td>{row.customerName || `#${row.customerId}`}</td>
                    <td>{row.paymentMethod}</td>
                    <td>{row.referenceCode}</td>
                    <td>{row.gatewayTransactionId || '—'}</td>
                    <td>{money(row.amount)}{row.refundedAmount > 0 && <small> (−{money(row.refundedAmount)})</small>}</td>
                    <td>{row.status}</td>
                    <td>{row.paidAt ? new Date(row.paidAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-pager">
          <button className="ghost-button" disabled={page <= 0} onClick={() => setPage(page - 1)}>{at('prev')}</button>
          <span>{page + 1}</span>
          <button className="ghost-button" disabled={!hasNext} onClick={() => setPage(page + 1)}>{at('next')}</button>
        </div>
      </section>
    </div>
  );
}
