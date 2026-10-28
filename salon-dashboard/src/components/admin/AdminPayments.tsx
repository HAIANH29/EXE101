import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { usePayT } from '../../payI18n';
import { adminApi } from '../../services/adminApi';
import { PaymentInfo, PaymentStatus, UserAccount } from '../../types/salon';
import { Pager } from './AdminParts';

/* ────── Sub-tabs ────── */
type SubTab = 'list' | 'users' | 'refund';

type RefundFormState = {
  paymentId: string;
  refundAmount: string;
  refundReference: string;
  note: string;
};

const EMPTY_REFUND: RefundFormState = { paymentId: '', refundAmount: '', refundReference: '', note: '' };

const PAYMENT_STATUS_TONE: Record<string, string> = {
  PENDING: 'warn',
  PAID: 'ok',
  FAILED: 'bad',
  CANCELLED: 'muted',
  REFUND_PENDING: 'warn',
  REFUNDED: 'muted'
};

const STATUS_FILTERS: { key: string; labelKey: string }[] = [
  { key: '', labelKey: 'adFilterAll' },
  { key: 'PAID', labelKey: 'payStatusPAID' },
  { key: 'PENDING', labelKey: 'payStatusPENDING' },
  { key: 'REFUND_PENDING', labelKey: 'payStatusREFUND_PENDING' },
  { key: 'REFUNDED', labelKey: 'payStatusREFUNDED' },
  { key: 'FAILED', labelKey: 'payStatusFAILED' }
];

export function AdminPayments() {
  const { money, dateTime, date } = useI18n();
  const at = useAdminT();
  const pt = usePayT();

  const [subTab, setSubTab] = useState<SubTab>('list');
  const [statusFilter, setStatusFilter] = useState('');

  /* ── List state ── */
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [pageNo, setPageNo] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string>();

  /* ── Users lookup cache ── */
  const [usersMap, setUsersMap] = useState<Record<number, UserAccount>>({});

  /* ── Lookup by ID state ── */
  const [lookupId, setLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<PaymentInfo | null>(null);
  const [lookupError, setLookupError] = useState<string>();

  /* ── Detail modal ── */
  const [detailPayment, setDetailPayment] = useState<PaymentInfo | null>(null);

  /* ── Refund state ── */
  const [refundForm, setRefundForm] = useState<RefundFormState>(EMPTY_REFUND);
  const [submitting, setSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string>();
  const [refundNotice, setRefundNotice] = useState<string>();
  const [refundLog, setRefundLog] = useState<PaymentInfo[]>([]);

  /* ────── Load user accounts for displaying customer names ────── */
  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      try {
        const res = await adminApi.getUsers('', 0, 100);
        if (!active) return;
        const map: Record<number, UserAccount> = {};
        (res.content || []).forEach((u) => {
          map[u.id] = u;
        });
        setUsersMap(map);
      } catch {
        // ignore
      }
    };
    void fetchUsers();
    return () => {
      active = false;
    };
  }, []);

  /* ────── Load payments list ────── */
  const loadPayments = async () => {
    setListLoading(true);
    setListError(undefined);
    try {
      const result = await adminApi.getPayments(pageNo, 10, statusFilter);
      setPayments(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      setListError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'list' || subTab === 'users') void loadPayments();
  }, [pageNo, statusFilter, subTab]);

  /* ────── Lookup by ID ────── */
  const handleLookup = async (event: FormEvent) => {
    event.preventDefault();
    const id = Number(lookupId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      setLookupError(pt('adPaymentId'));
      return;
    }
    setLookupLoading(true);
    setLookupError(undefined);
    setLookupResult(null);
    try {
      const payment = await adminApi.getPaymentById(id);
      setLookupResult(payment);
      setDetailPayment(payment);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLookupLoading(false);
    }
  };

  /* ────── Refund submit ────── */
  const submitRefund = async (event: FormEvent) => {
    event.preventDefault();
    setRefundError(undefined);
    setRefundNotice(undefined);

    const paymentId = Number(refundForm.paymentId);
    const refundAmount = Number(refundForm.refundAmount);
    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      setRefundError(pt('adPaymentId'));
      return;
    }
    if (!(refundAmount > 0)) {
      setRefundError(pt('adRefundAmount'));
      return;
    }
    if (!window.confirm(pt('adRefundConfirm', { amount: money(refundAmount), id: paymentId }))) return;

    setSubmitting(true);
    try {
      const result = await adminApi.refundPayment(paymentId, {
        refundAmount,
        refundReference: refundForm.refundReference.trim(),
        note: refundForm.note.trim() || undefined
      });
      setRefundLog((current) => [result, ...current]);
      setRefundNotice(pt('adRefundSuccess', { id: paymentId }));
      setRefundForm(EMPTY_REFUND);
      void loadPayments();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ────── Quick-refund from detail modal ────── */
  const startRefundFromDetail = (payment: PaymentInfo) => {
    setDetailPayment(null);
    setSubTab('refund');
    setRefundForm({
      paymentId: String(payment.id),
      refundAmount: String(Math.round(Number(payment.amount))),
      refundReference: '',
      note: ''
    });
  };

  /* ────── Aggregated user payment statistics ────── */
  const userStats = useMemo(() => {
    type Stat = {
      userId: number;
      txCount: number;
      paidAmount: number;
      lastPaymentAt?: string;
      payments: PaymentInfo[];
    };
    const map = new Map<number, Stat>();

    for (const p of payments) {
      const uid = p.customerId ?? 0;
      if (!uid) continue;
      const existing: Stat = map.get(uid) || {
        userId: uid,
        txCount: 0,
        paidAmount: 0,
        payments: []
      };
      existing.txCount += 1;
      if (p.status === 'PAID') {
        existing.paidAmount += Number(p.amount) || 0;
      }
      if (!existing.lastPaymentAt || (p.createdAt && p.createdAt > existing.lastPaymentAt)) {
        existing.lastPaymentAt = p.paidAt || p.createdAt;
      }
      existing.payments.push(p);
      map.set(uid, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.paidAmount - a.paidAmount);
  }, [payments]);

  return (
    <div className="screen-stack">
      {/* Screen Header */}
      <div className="screen-header">
        <div>
          <span className="eyebrow">{pt('adTabPayments')}</span>
          <h2>{pt('adPaymentsTitle')}</h2>
          <p>{pt('adPaymentsDesc')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={() => void loadPayments()}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            {listLoading ? at('loading') : at('refresh')}
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="status-tabs">
        <button className={subTab === 'list' ? 'active' : ''} onClick={() => setSubTab('list')}>
          {pt('adSubTabList')}
        </button>
        <button className={subTab === 'users' ? 'active' : ''} onClick={() => setSubTab('users')}>
          {pt('adSubTabUsers')} {userStats.length > 0 && `(${userStats.length})`}
        </button>
        <button className={subTab === 'refund' ? 'active' : ''} onClick={() => setSubTab('refund')}>
          {pt('adSubTabRefund')}
        </button>
      </div>

      {/* ═══════════════ TAB 1: DANH SÁCH GIAO DỊCH ═══════════════ */}
      {subTab === 'list' && (
        <>
          {/* Quick lookup by ID */}
          <section className="panel" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 14 }}>{pt('adLookupTitle')}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{pt('adLookupDesc')}</p>
              </div>
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  placeholder={pt('adPaymentId')}
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  style={{ width: 160, padding: '7px 12px', fontSize: 13, borderRadius: 10, border: '1px solid var(--line)' }}
                />
                <button type="submit" className="solid-button mini" disabled={lookupLoading}>
                  {lookupLoading ? at('loading') : pt('adLookupBtn')}
                </button>
              </form>
            </div>
            {lookupError && <div className="error-banner" style={{ marginTop: 10 }}>{lookupError}</div>}
          </section>

          {/* Payments list panel */}
          <section className="panel">
            <div className="panel-head" style={{ flexWrap: 'wrap', gap: 12 }}>
              {/* Filter pills */}
              <div className="filter-pills">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`pill-button ${statusFilter === f.key ? 'active' : ''}`}
                    onClick={() => {
                      setStatusFilter(f.key);
                      setPageNo(0);
                    }}
                  >
                    {pt(f.labelKey)}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {pt('adPaymentsListDesc', { count: totalElements })}
              </span>
            </div>

            {listError && <div className="error-banner">{listError}</div>}

            {listLoading ? (
              <div className="empty-row">{at('loading')}</div>
            ) : payments.length === 0 ? (
              <div className="empty-row">{pt('adPaymentsEmpty')}</div>
            ) : (
              <div className="table-wrapper">
                <div
                  className="table-header"
                  style={{ gridTemplateColumns: '0.6fr 1.4fr 1fr 1fr 1fr 1fr 0.8fr' }}
                >
                  <span>ID</span>
                  <span>{pt('adUserPayments')}</span>
                  <span>{pt('subColType')}</span>
                  <span>{pt('subColAmount')}</span>
                  <span>{pt('subColStatus')}</span>
                  <span>{pt('subColDate')}</span>
                  <span style={{ textAlign: 'right' }}>{at('actions')}</span>
                </div>

                {payments.map((payment) => {
                  const customer = payment.customerId ? usersMap[payment.customerId] : undefined;
                  return (
                    <div
                      key={payment.id}
                      className="table-row"
                      style={{
                        gridTemplateColumns: '0.6fr 1.4fr 1fr 1fr 1fr 1fr 0.8fr',
                        cursor: 'pointer',
                        alignItems: 'center'
                      }}
                      onClick={() => setDetailPayment(payment)}
                    >
                      <span><b>#{payment.id}</b></span>
                      <div>
                        {customer ? (
                          <>
                            <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{customer.fullName}</strong>
                            <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                              {customer.email}
                            </small>
                          </>
                        ) : payment.customerId ? (
                          <span style={{ fontSize: 13 }}>Khách #{payment.customerId}</span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                        )}
                      </div>
                      <div>
                        <strong style={{ fontSize: 12 }}>{pt(`payType${payment.paymentType}`)}</strong>
                        {payment.bookingId && (
                          <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                            Booking #{payment.bookingId}
                          </small>
                        )}
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, color: 'var(--brand)' }}>{money(payment.amount)}</strong>
                      </div>
                      <div>
                        <span className={`status-pill ${PAYMENT_STATUS_TONE[payment.status] || 'muted'}`}>
                          {pt(`payStatus${payment.status}`)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {payment.paidAt ? dateTime(payment.paidAt) : payment.createdAt ? date(payment.createdAt) : '—'}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="ghost-button mini"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailPayment(payment);
                          }}
                          title={at('slViewDetail')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Pager page={pageNo} totalPages={totalPages} onChange={setPageNo} />
          </section>
        </>
      )}

      {/* ═══════════════ TAB 2: DANH SÁCH NGƯỜI DÙNG THANH TOÁN ═══════════════ */}
      {subTab === 'users' && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{pt('adSubTabUsers')}</h3>
              <p>{userStats.length} người dùng đã thực hiện giao dịch</p>
            </div>
          </div>

          {userStats.length === 0 ? (
            <div className="empty-row">{pt('adUserEmpty')}</div>
          ) : (
            <div className="table-wrapper">
              <div
                className="table-header"
                style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 0.8fr' }}
              >
                <span>{pt('adUserPayments')}</span>
                <span>{pt('adUserTxCount')}</span>
                <span>{pt('adUserTotalPaid')}</span>
                <span>{pt('adUserLastPaid')}</span>
                <span style={{ textAlign: 'right' }}>{at('actions')}</span>
              </div>

              {userStats.map((stat) => {
                const u = usersMap[stat.userId];
                return (
                  <div
                    key={stat.userId}
                    className="table-row"
                    style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 0.8fr', alignItems: 'center' }}
                  >
                    <div>
                      {u ? (
                        <>
                          <strong style={{ fontSize: 14 }}>{u.fullName}</strong>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                            {u.email} {u.phone && `· ${u.phone}`}
                          </div>
                        </>
                      ) : (
                        <strong>Người dùng #{stat.userId}</strong>
                      )}
                    </div>
                    <div>
                      <span className="pill-badge">{stat.txCount} giao dịch</span>
                    </div>
                    <div>
                      <strong style={{ color: '#2f6b45', fontSize: 14 }}>{money(stat.paidAmount)}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {stat.lastPaymentAt ? dateTime(stat.lastPaymentAt) : '—'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="ghost-button mini"
                        onClick={() => {
                          if (stat.payments[0]) setDetailPayment(stat.payments[0]);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                        Xem GD
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════ TAB 3: XỬ LÝ HOÀN TIỀN ═══════════════ */}
      {subTab === 'refund' && (
        <>
          {refundError && <div className="error-banner">{refundError}</div>}
          {refundNotice && <div className="success-banner">{refundNotice}</div>}

          <div className="two-column">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>{pt('adRefundTitle')}</h3>
                  <p>{pt('adRefundHelp')}</p>
                </div>
              </div>
              <form className="form-grid" onSubmit={submitRefund}>
                <label>
                  {pt('adPaymentId')}
                  <input
                    value={refundForm.paymentId}
                    onChange={(event) => setRefundForm({ ...refundForm, paymentId: event.target.value })}
                    type="number"
                    min={1}
                    required
                  />
                </label>
                <label>
                  {pt('adRefundAmount')}
                  <input
                    value={refundForm.refundAmount}
                    onChange={(event) => setRefundForm({ ...refundForm, refundAmount: event.target.value })}
                    type="number"
                    min={1}
                    required
                  />
                </label>
                <label className="full">
                  {pt('adRefundReference')}
                  <input
                    value={refundForm.refundReference}
                    onChange={(event) => setRefundForm({ ...refundForm, refundReference: event.target.value })}
                    required
                  />
                </label>
                <label className="full">
                  {pt('adRefundNote')}
                  <textarea
                    rows={3}
                    value={refundForm.note}
                    onChange={(event) => setRefundForm({ ...refundForm, note: event.target.value })}
                  />
                </label>
                <button className="solid-button" disabled={submitting}>
                  {submitting ? pt('adRefundSubmitting') : pt('adRefundSubmit')}
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <h3>{pt('adRefundLog')}</h3>
                  <p>{refundLog.length}</p>
                </div>
              </div>
              {refundLog.length === 0 ? (
                <div className="empty-row">{pt('adRefundLogEmpty')}</div>
              ) : (
                <div className="appointments-table">
                  {refundLog.map((payment) => (
                    <div className="table-row" key={`${payment.id}-${payment.refundedAt}`} style={{ gridTemplateColumns: '0.7fr 1fr 1fr 1.2fr' }}>
                      <span>
                        <b>#{payment.id}</b>
                        <small>{pt(`payType${payment.paymentType}`)}</small>
                      </span>
                      <span>
                        <b>{money(payment.refundAmount ?? 0)}</b>
                        <small>/ {money(payment.amount)}</small>
                      </span>
                      <span>
                        <span className="status-pill ok">{pt(`payStatus${payment.status}`)}</span>
                      </span>
                      <span>
                        <b>{payment.refundReference || '—'}</b>
                        <small>{payment.refundedAt ? `${pt('adRefundedAt')} ${dateTime(payment.refundedAt)}` : ''}</small>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* ═══════════════ DETAIL MODAL (CHI TIẾT THANH TOÁN) ═══════════════ */}
      {detailPayment && (
        <div className="admin-modal-backdrop" onClick={() => setDetailPayment(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3>{pt('adDetailTitle', { id: detailPayment.id })}</h3>
                  <span className={`status-pill ${PAYMENT_STATUS_TONE[detailPayment.status] || 'muted'}`}>
                    {pt(`payStatus${detailPayment.status}`)}
                  </span>
                </div>
                {detailPayment.referenceCode && (
                  <p style={{ margin: '2px 0 0' }}>Mã tham chiếu: <b>{detailPayment.referenceCode}</b></p>
                )}
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setDetailPayment(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: 'grid', gap: 16 }}>
              {/* Financial summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: 16,
                  background: 'var(--surface-soft)',
                  borderRadius: 14
                }}
              >
                <div>
                  <small style={{ color: 'var(--muted)' }}>{pt('subColType')}</small>
                  <strong style={{ display: 'block', fontSize: 14 }}>{pt(`payType${detailPayment.paymentType}`)}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>{pt('subColAmount')}</small>
                  <strong style={{ display: 'block', fontSize: 18, color: 'var(--brand)' }}>{money(detailPayment.amount)}</strong>
                </div>
                {detailPayment.serviceAmount != null && (
                  <div>
                    <small style={{ color: 'var(--muted)' }}>{pt('adServiceAmount')}</small>
                    <strong style={{ display: 'block' }}>{money(detailPayment.serviceAmount)}</strong>
                  </div>
                )}
                {detailPayment.feeAmount != null && (
                  <div>
                    <small style={{ color: 'var(--muted)' }}>{pt('adFeeAmount')}</small>
                    <strong style={{ display: 'block' }}>{money(detailPayment.feeAmount)}</strong>
                  </div>
                )}
                {detailPayment.provider && (
                  <div>
                    <small style={{ color: 'var(--muted)' }}>{pt('adProvider')}</small>
                    <strong style={{ display: 'block' }}>{detailPayment.provider}</strong>
                  </div>
                )}
                {detailPayment.transactionId && (
                  <div>
                    <small style={{ color: 'var(--muted)' }}>{pt('payTxn')}</small>
                    <strong style={{ display: 'block', fontSize: 13 }}>{detailPayment.transactionId}</strong>
                  </div>
                )}
              </div>

              {/* Related entities */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: 14,
                  background: 'var(--surface-soft)',
                  borderRadius: 14
                }}
              >
                <div>
                  <small style={{ color: 'var(--muted)' }}>Khách hàng</small>
                  <strong style={{ display: 'block' }}>
                    {detailPayment.customerId && usersMap[detailPayment.customerId]
                      ? `${usersMap[detailPayment.customerId].fullName} (#${detailPayment.customerId})`
                      : detailPayment.customerId
                      ? `#${detailPayment.customerId}`
                      : '—'}
                  </strong>
                </div>
                {detailPayment.bookingId && (
                  <div>
                    <small style={{ color: 'var(--muted)' }}>Lịch hẹn (Booking)</small>
                    <strong style={{ display: 'block' }}>#{detailPayment.bookingId}</strong>
                  </div>
                )}
                {detailPayment.salonId && (
                  <div>
                    <small style={{ color: 'var(--muted)' }}>Chi nhánh Salon</small>
                    <strong style={{ display: 'block' }}>#{detailPayment.salonId}</strong>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: 14,
                  background: 'var(--surface-soft)',
                  borderRadius: 14
                }}
              >
                <div>
                  <small style={{ color: 'var(--muted)' }}>{pt('adCreatedAt')}</small>
                  <strong style={{ display: 'block', fontSize: 13 }}>
                    {detailPayment.createdAt ? dateTime(detailPayment.createdAt) : '—'}
                  </strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>{pt('adPaidAt')}</small>
                  <strong style={{ display: 'block', fontSize: 13 }}>
                    {detailPayment.paidAt ? dateTime(detailPayment.paidAt) : 'Chưa thanh toán'}
                  </strong>
                </div>
              </div>

              {/* QR Code image if available */}
              {detailPayment.paymentUrl && detailPayment.status === 'PENDING' && (
                <div style={{ textAlign: 'center', padding: 14, background: 'var(--surface-soft)', borderRadius: 14 }}>
                  <img
                    src={detailPayment.paymentUrl}
                    alt="VietQR"
                    style={{ maxWidth: 180, borderRadius: 10, border: '1px solid var(--line)' }}
                  />
                  <small style={{ display: 'block', color: 'var(--muted)', marginTop: 6 }}>
                    Mã VietQR thanh toán tự động
                  </small>
                </div>
              )}

              {/* Refund section */}
              {(detailPayment.refundAmount || detailPayment.refundedAt || detailPayment.status === 'REFUND_PENDING' || detailPayment.status === 'REFUNDED') && (
                <div
                  style={{
                    padding: 14,
                    background: detailPayment.status === 'REFUNDED' ? 'rgba(47, 107, 69, 0.06)' : '#fef7ed',
                    border: `1px solid ${detailPayment.status === 'REFUNDED' ? 'rgba(47, 107, 69, 0.15)' : '#ead7bf'}`,
                    borderRadius: 14
                  }}
                >
                  <strong style={{ display: 'block', marginBottom: 8 }}>{pt('adRefundInfo')}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {detailPayment.refundAmount != null && (
                      <div>
                        <small style={{ color: 'var(--muted)' }}>{pt('adRefundAmount')}</small>
                        <strong style={{ display: 'block' }}>{money(detailPayment.refundAmount)}</strong>
                      </div>
                    )}
                    {detailPayment.refundReference && (
                      <div>
                        <small style={{ color: 'var(--muted)' }}>{pt('adRefundReference')}</small>
                        <strong style={{ display: 'block', fontSize: 13 }}>{detailPayment.refundReference}</strong>
                      </div>
                    )}
                    {detailPayment.refundReason && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <small style={{ color: 'var(--muted)' }}>{pt('adRefundNote')}</small>
                        <p style={{ margin: '2px 0 0', fontSize: 13 }}>{detailPayment.refundReason}</p>
                      </div>
                    )}
                    {detailPayment.refundedAt && (
                      <div>
                        <small style={{ color: 'var(--muted)' }}>{pt('adRefundedAt')}</small>
                        <strong style={{ display: 'block', fontSize: 12 }}>{dateTime(detailPayment.refundedAt)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick refund action button */}
              {(detailPayment.status === 'PAID' || detailPayment.status === 'REFUND_PENDING') && (
                <button
                  type="button"
                  className="solid-button"
                  style={{ background: '#b95b12', borderColor: '#b95b12', width: '100%' }}
                  onClick={() => startRefundFromDetail(detailPayment)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>currency_exchange</span>
                  {pt('adQuickRefund')}
                </button>
              )}
            </div>

            <div className="admin-modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
              <button type="button" className="ghost-button" onClick={() => setDetailPayment(null)}>
                {at('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
