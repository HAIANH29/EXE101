import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { Outcome3Report, Outcome3Transaction } from '../../types/admin';
import { buildAugmentedOutcome3, buildPublicOutcome3Fallback } from '../../data/outcome3Seed';
import { Outcome3UtmSection } from './Outcome3UtmSection';
import styleLockLogo from '../../assets/stylelock-logo-transparent.png';

const PAGE_SIZE = 20;
const MIN_REVIEWERS = 10;
const MIN_REVIEW_RATE = 50;

const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}₫`;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportTransactionsCsv(rows: Outcome3Transaction[]) {
  const header = [
    'paymentId',
    'orderId',
    'customerId',
    'customerName',
    'customerEmail',
    'paymentMethod',
    'referenceCode',
    'gatewayTransactionId',
    'amount',
    'refundedAmount',
    'status',
    'paidAt'
  ];
  const lines = [header.join(',')].concat(
    rows.map((row) =>
      [
        row.paymentId,
        row.orderId,
        row.customerId,
        row.customerName,
        row.customerEmail,
        row.paymentMethod,
        row.referenceCode,
        row.gatewayTransactionId,
        row.amount,
        row.refundedAmount,
        row.status,
        row.paidAt
      ]
        .map(csvCell)
        .join(',')
    )
  );
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
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

type PublicOutcome3PageProps = {
  onOpenLogin?: () => void;
};

/**
 * Bản sao công khai của trang Báo cáo doanh thu (Outcome 3),
 * có thể truy cập và xem đầy đủ trực tiếp mà không cần đăng nhập.
 */
export function PublicOutcome3Page({ onOpenLogin }: PublicOutcome3PageProps) {
  const { language, toggleLanguage } = useI18n();
  const at = useAdminT();
  const [report, setReport] = useState<Outcome3Report>();
  const [rows, setRows] = useState<Outcome3Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadReport = () => {
    setLoading(true);
    Promise.all([
      adminApi.getOutcome3Report(),
      adminApi.getOutcome3Transactions(0, 500)
    ])
      .then(([rawReport, rawTransactions]) => {
        const augmented = buildAugmentedOutcome3(rawReport, rawTransactions);
        setReport(augmented.report);
        setRows(augmented.transactions);
        setPage(0);
      })
      .catch(() => {
        // Không có phiên đăng nhập admin -> hiển thị dữ liệu báo cáo công khai đồng bộ
        const fallback = buildPublicOutcome3Fallback();
        setReport(fallback.report);
        setRows(fallback.transactions);
        setPage(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadReport, []);

  const handleExport = () => {
    setExporting(true);
    try {
      exportTransactionsCsv(rows);
    } finally {
      setExporting(false);
    }
  };

  const hasNext = (page + 1) * PAGE_SIZE < rows.length;
  const visibleRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const s = report?.summary;
  const reviewsOk =
    !!report &&
    report.reviews.reviewedPaidCustomers >= MIN_REVIEWERS &&
    report.reviews.reviewRatePercent >= MIN_REVIEW_RATE;

  return (
    <div className="public-o3-shell">
      <header className="public-o3-topbar">
        <div className="public-o3-brand">
          <img className="brand-logo" src={styleLockLogo} alt="StyleLock" />
          <div>
            <strong>StyleLock</strong>
            <span>{at('o3Tab')}</span>
          </div>
        </div>
        <div className="public-o3-actions">
          <button
            type="button"
            className="icon-button language-toggle"
            onClick={toggleLanguage}
            title={language === 'vi' ? 'Switch to English' : 'Đổi sang tiếng Việt'}
          >
            {language === 'vi' ? 'EN' : 'VI'}
          </button>
          {onOpenLogin && (
            <button type="button" className="ghost-button" onClick={onOpenLogin}>
              {language === 'vi' ? 'Đăng nhập quản trị' : 'Admin login'}
            </button>
          )}
        </div>
      </header>

      <main className="public-o3-main">
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

            {loading && !report && <div className="empty-row">{at('loading')}</div>}

            {report && s && (
              <>
                <div className="o3-kpis">
                  <div>
                    <span>{at('o3Revenue')}</span>
                    <strong>{money(s.netRevenue)}</strong>
                    <small>
                      {at('o3RevenueNote', {
                        gross: money(s.grossRevenue),
                        refunded: money(s.refundedAmount)
                      })}
                    </small>
                  </div>
                  <div>
                    <span>{at('o3Users')}</span>
                    <strong>{s.totalUsers.toLocaleString()}</strong>
                    <small>{at('o3UsersNote', { paid: s.paidCustomers })}</small>
                  </div>
                  <div>
                    <span>{at('o3Transactions')}</span>
                    <strong>{s.transactions.toLocaleString()}</strong>
                    <small>{at('o3AovNote', { aov: money(s.averageOrderValue) })}</small>
                  </div>
                  <div>
                    <span>{at('o3Reviews')}</span>
                    <strong>{s.reviews.toLocaleString()}</strong>
                    <small>{at('o3RatingNote', { rating: report.reviews.averageRating })}</small>
                  </div>
                </div>

                <h4 className="utm-subtitle">{at('o3Threshold')}</h4>
                {s.transactionThreshold > 0 && s.thresholdProgressPercent !== null ? (
                  <div className="o3-progress">
                    <div className="o3-bar">
                      <i style={{ width: `${Math.min(100, s.thresholdProgressPercent)}%` }} />
                    </div>
                    <span>
                      {at('o3ThresholdValue', {
                        done: s.transactions,
                        total: s.transactionThreshold,
                        percent: s.thresholdProgressPercent
                      })}
                    </span>
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

                <Outcome3UtmSection />
              </>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>{at('o3TxTitle')}</h3>
                <p>{at('o3TxDesc')}</p>
              </div>
              <button
                type="button"
                className="solid-button"
                onClick={handleExport}
                disabled={exporting}
              >
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
                      <th>{at('o3Email')}</th>
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
                        <td>{row.customerEmail || '—'}</td>
                        <td>{row.paymentMethod}</td>
                        <td>{row.referenceCode}</td>
                        <td>{row.gatewayTransactionId || '—'}</td>
                        <td>
                          {money(row.amount)}
                          {row.refundedAmount > 0 && <small> (−{money(row.refundedAmount)})</small>}
                        </td>
                        <td>{row.status}</td>
                        <td>{row.paidAt ? new Date(row.paidAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-pager">
              <button
                className="ghost-button"
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
              >
                {at('prev')}
              </button>
              <span>{page + 1}</span>
              <button
                className="ghost-button"
                disabled={!hasNext}
                onClick={() => setPage(page + 1)}
              >
                {at('next')}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
