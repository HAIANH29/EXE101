import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminBookingStats } from '../../types/admin';
import { Appointment, BackendBookingStatus, UserAccount } from '../../types/salon';
import { augmentBookingStats, getSeedUsersMap, getSyncedSeedEntities } from '../../data/outcome3Seed';
import { Pager, StatusPill } from './AdminParts';

const PAGE_SIZE = 15;

const FILTERS: { key: BackendBookingStatus | ''; labelKey: string }[] = [
  { key: 'PENDING', labelKey: 'bkPending' },
  { key: '', labelKey: 'all' },
  { key: 'CONFIRMED', labelKey: 'bkConfirmed' },
  { key: 'COMPLETED', labelKey: 'bkCompleted' },
  { key: 'CANCELLED', labelKey: 'bkCancelled' }
];

const STATUS_LABEL_KEY: Record<string, string> = {
  PENDING: 'bkPending',
  CONFIRMED: 'bkConfirmed',
  IN_SERVICE: 'bkConfirmed',
  COMPLETED: 'bkCompleted',
  CANCELLED: 'bkCancelled'
};

export function AdminBookings() {
  const { dateTime, money } = useI18n();
  const at = useAdminT();

  const [filter, setFilter] = useState<BackendBookingStatus | ''>('PENDING');
  const [search, setSearch] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState<AdminBookingStats>();
  const [usersMap, setUsersMap] = useState<Record<number, UserAccount>>(() => getSeedUsersMap());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busyId, setBusyId] = useState<number>();
  const [detailBooking, setDetailBooking] = useState<Appointment | null>(null);

  useEffect(() => {
    let active = true;
    adminApi
      .getUsers('', 0, 200)
      .then((res) => {
        if (!active) return;
        const map: Record<number, UserAccount> = { ...getSeedUsersMap() };
        (res.content || []).forEach((u) => {
          map[u.id] = u;
        });
        setUsersMap(map);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [result, rawStats, o3Report, o3Tx] = await Promise.all([
        adminApi.getBookings(filter, 0, 200),
        adminApi.getBookingStats().catch(() => undefined),
        adminApi.getOutcome3Report().catch(() => undefined),
        adminApi.getOutcome3Transactions(0, 500).catch(() => [])
      ]);
      const realBookings = result.content || [];
      const synced = getSyncedSeedEntities(o3Tx, o3Report?.summary.transactions ?? o3Tx.length);
      setStats(augmentBookingStats(rawStats, synced.bookings.length));

      const includeSeed = filter === '' || filter === 'COMPLETED';
      const merged = (includeSeed ? [...synced.bookings, ...realBookings] : realBookings).sort((a, b) => {
        const ta = new Date(a.startAt || a.createdAt || 0).getTime();
        const tb = new Date(b.startAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
      const start = pageNo * PAGE_SIZE;
      setBookings(merged.slice(start, start + PAGE_SIZE));
      setTotalPages(Math.max(1, Math.ceil(merged.length / PAGE_SIZE)));
      setTotalElements(merged.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter, pageNo]);

  const changeFilter = (next: BackendBookingStatus | '') => {
    setPageNo(0);
    setFilter(next);
  };

  const handleAction = async (booking: Appointment, action: 'confirm' | 'complete' | 'cancel') => {
    if (action === 'confirm') {
      if (!window.confirm(at('bkConfirmPrompt', { id: booking.id, salon: booking.salonName || `#${booking.salonId}` }))) {
        return;
      }
    } else if (action === 'complete') {
      if (!window.confirm(at('bkCompletePrompt', { id: booking.id }))) {
        return;
      }
    }

    let cancelReason = 'Admin hủy lịch hẹn từ cổng quản trị';
    if (action === 'cancel') {
      const input = window.prompt(at('bkCancelPrompt', { id: booking.id }), cancelReason);
      if (input === null) return;
      if (input.trim()) cancelReason = input.trim();
    }

    setBusyId(booking.id);
    setError(undefined);
    setNotice(undefined);
    try {
      const updated =
        action === 'confirm'
          ? await adminApi.confirmBooking(booking.id)
          : action === 'complete'
          ? await adminApi.completeBooking(booking.id)
          : await adminApi.cancelBooking(booking.id, cancelReason);

      setNotice(at('bkUpdatedSuccess', { id: booking.id }));
      if (detailBooking?.id === booking.id) {
        setDetailBooking(updated);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  const displayedBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const customer = usersMap[b.customerId];
      return (
        String(b.id).includes(q) ||
        b.salonName?.toLowerCase().includes(q) ||
        b.serviceName?.toLowerCase().includes(q) ||
        b.stylistName?.toLowerCase().includes(q) ||
        b.note?.toLowerCase().includes(q) ||
        customer?.fullName?.toLowerCase().includes(q) ||
        customer?.email?.toLowerCase().includes(q) ||
        customer?.phone?.toLowerCase().includes(q)
      );
    });
  }, [bookings, search, usersMap]);

  const pendingCount = stats?.pending ?? 0;
  const confirmedCount = stats?.confirmed ?? 0;
  const completedCount = stats?.completed ?? 0;
  const cancelledCount = stats?.cancelled ?? 0;
  const totalCount = stats?.total ?? totalElements;

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{at('tabBookings')}</span>
          <h2>{at('bkAdminTitle')}</h2>
          <p>{at('bkAdminDesc')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={() => void load()}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            {loading ? at('loading') : at('refresh')}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {pendingCount > 0 && filter !== 'PENDING' && (
        <div className="admin-callout admin-callout-pending">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined callout-icon" style={{ fontSize: 32, color: 'var(--brand)' }}>
              event_upcoming
            </span>
            <div>
              <strong style={{ fontSize: 16 }}>{at('bkPendingAlertTitle', { count: pendingCount })}</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {at('bkPendingAlertDesc')}
              </p>
            </div>
          </div>
          <button type="button" className="solid-button mini" onClick={() => changeFilter('PENDING')}>
            {at('bkReviewNow')}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </div>
      )}

      {/* Thẻ thống kê nhanh */}
      <div className="metrics-grid admin-metrics">
        <div
          className={`metric-card clickable ${pendingCount > 0 ? 'warning' : ''} ${filter === 'PENDING' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('PENDING')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('bkPending')}</span>
            <strong style={pendingCount > 0 ? { color: '#b95b12' } : {}}>{pendingCount}</strong>
            <small>{at('hintBookings')}</small>
          </div>
          <span className="material-symbols-outlined" style={pendingCount > 0 ? { color: '#b95b12' } : {}}>
            pending_actions
          </span>
        </div>

        <div
          className={`metric-card clickable success ${filter === 'CONFIRMED' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('CONFIRMED')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('bkConfirmed')}</span>
            <strong>{confirmedCount}</strong>
            <small>{at('tabBookings')}</small>
          </div>
          <span className="material-symbols-outlined">event_available</span>
        </div>

        <div
          className={`metric-card clickable ${filter === 'COMPLETED' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('COMPLETED')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('bkCompleted')}</span>
            <strong>{completedCount}</strong>
            <small>{at('tabBookings')}</small>
          </div>
          <span className="material-symbols-outlined">task_alt</span>
        </div>

        <div
          className={`metric-card clickable ${filter === '' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('all')}</span>
            <strong>{totalCount}</strong>
            <small>{`${at('bkCancelled')}: ${cancelledCount}`}</small>
          </div>
          <span className="material-symbols-outlined">calendar_month</span>
        </div>
      </div>

      {/* Bảng danh sách lịch hẹn */}
      <section className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="filter-pills">
            {FILTERS.map((f) => {
              const count =
                f.key === ''
                  ? totalCount
                  : f.key === 'PENDING'
                  ? pendingCount
                  : f.key === 'CONFIRMED'
                  ? confirmedCount
                  : f.key === 'COMPLETED'
                  ? completedCount
                  : cancelledCount;
              return (
                <button
                  key={f.key || 'ALL'}
                  type="button"
                  className={`pill-button ${filter === f.key ? 'active' : ''}`}
                  onClick={() => changeFilter(f.key)}
                >
                  {at(f.labelKey)} {count > 0 && <span className="pill-badge">({count})</span>}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', minWidth: 280 }}>
            <input
              type="text"
              placeholder={at('bkSearchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 12,
                border: '1px solid var(--line)',
                fontSize: 13
              }}
            />
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                color: 'var(--muted)'
              }}
            >
              search
            </span>
          </div>
        </div>

        {loading ? (
          <div className="empty-row">{at('loading')}</div>
        ) : displayedBookings.length === 0 ? (
          <div className="empty-row">{at('bkEmpty')}</div>
        ) : (
          <div className="table-wrapper">
            <div
              className="table-header"
              style={{ gridTemplateColumns: '0.6fr 1.3fr 1.4fr 1.3fr 1.1fr 0.8fr 0.9fr 1.5fr' }}
            >
              <span>ID</span>
              <span>Khách hàng</span>
              <span>Chi nhánh Salon</span>
              <span>Dịch vụ & Stylist</span>
              <span>Giờ hẹn</span>
              <span>Tổng tiền</span>
              <span>{at('status')}</span>
              <span style={{ textAlign: 'right' }}>{at('actions')}</span>
            </div>

            {displayedBookings.map((booking) => {
              const isPending = booking.status === 'PENDING';
              const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'IN_SERVICE';
              const isBusy = busyId === booking.id;
              const customer = usersMap[booking.customerId];

              return (
                <div
                  key={booking.id}
                  className="table-row"
                  style={{
                    gridTemplateColumns: '0.6fr 1.3fr 1.4fr 1.3fr 1.1fr 0.8fr 0.9fr 1.5fr',
                    alignItems: 'center',
                    background: isPending ? 'rgba(234, 215, 191, 0.12)' : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => setDetailBooking(booking)}
                >
                  <span>
                    <b>#{booking.id}</b>
                  </span>

                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                      {customer?.fullName || `Khách #${booking.customerId}`}
                    </strong>
                    <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                      {customer?.phone || customer?.email || booking.note || '—'}
                    </small>
                  </div>

                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                      {booking.salonName || `Salon #${booking.salonId}`}
                    </strong>
                    {booking.salonAddress && (
                      <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                        {booking.salonAddress}
                      </small>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: 13, color: 'var(--ink)', display: 'block' }}>
                      {booking.serviceName || `Dịch vụ #${booking.serviceId}`}
                    </span>
                    <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                      Stylist: {booking.stylistName || `#${booking.stylistId}`}
                    </small>
                  </div>

                  <div style={{ fontSize: 12 }}>
                    <strong style={{ color: 'var(--ink)' }}>{dateTime(booking.startAt)}</strong>
                  </div>

                  <div>
                    <strong style={{ fontSize: 13, color: 'var(--brand)' }}>
                      {money(booking.totalAmount ?? 0)}
                    </strong>
                  </div>

                  <div>
                    <StatusPill
                      status={booking.status}
                      label={at(STATUS_LABEL_KEY[booking.status] || 'bkPending')}
                    />
                  </div>

                  <div
                    style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="solid-button mini"
                          style={{ background: '#2f6b45', color: '#fff', borderColor: '#2f6b45' }}
                          disabled={isBusy}
                          onClick={() => void handleAction(booking, 'confirm')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                          {at('bkConfirmAction')}
                        </button>
                        <button
                          type="button"
                          className="ghost-button mini"
                          style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                          disabled={isBusy}
                          onClick={() => void handleAction(booking, 'cancel')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          {at('bkCancelAction')}
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <>
                        <button
                          type="button"
                          className="solid-button mini"
                          disabled={isBusy}
                          onClick={() => void handleAction(booking, 'complete')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
                          {at('bkCompleteAction')}
                        </button>
                        <button
                          type="button"
                          className="ghost-button mini"
                          style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                          disabled={isBusy}
                          onClick={() => void handleAction(booking, 'cancel')}
                        >
                          {at('bkCancelAction')}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="ghost-button mini"
                      onClick={() => setDetailBooking(booking)}
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

      {/* Modal chi tiết lịch hẹn */}
      {detailBooking && (
        <div className="admin-modal-backdrop" onClick={() => setDetailBooking(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3>{at('bkDetailTitle', { id: detailBooking.id })}</h3>
                  <StatusPill
                    status={detailBooking.status}
                    label={at(STATUS_LABEL_KEY[detailBooking.status] || 'bkPending')}
                  />
                </div>
                <p style={{ margin: '4px 0 0' }}>
                  {detailBooking.salonName || `Salon #${detailBooking.salonId}`}
                </p>
              </div>
              <button type="button" className="admin-modal-close" onClick={() => setDetailBooking(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="admin-modal-body" style={{ display: 'grid', gap: 14 }}>
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
                    {usersMap[detailBooking.customerId]?.fullName || `Khách #${detailBooking.customerId}`}
                  </strong>
                  {usersMap[detailBooking.customerId]?.email && (
                    <small style={{ color: 'var(--muted)' }}>{usersMap[detailBooking.customerId].email}</small>
                  )}
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>Số điện thoại</small>
                  <strong style={{ display: 'block' }}>
                    {usersMap[detailBooking.customerId]?.phone || '—'}
                  </strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>Giờ hẹn</small>
                  <strong style={{ display: 'block' }}>{dateTime(detailBooking.startAt)}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>Tổng tiền dịch vụ</small>
                  <strong style={{ display: 'block', color: 'var(--brand)' }}>
                    {money(detailBooking.totalAmount ?? 0)}
                  </strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>Dịch vụ</small>
                  <strong style={{ display: 'block' }}>
                    {detailBooking.serviceName || `#${detailBooking.serviceId}`}
                  </strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)' }}>Stylist phụ trách</small>
                  <strong style={{ display: 'block' }}>
                    {detailBooking.stylistName || `#${detailBooking.stylistId}`}
                  </strong>
                </div>
                {detailBooking.hairstyleName && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <small style={{ color: 'var(--muted)' }}>Kiểu tóc đã chọn</small>
                    <strong style={{ display: 'block' }}>{detailBooking.hairstyleName}</strong>
                  </div>
                )}
                {detailBooking.salonAddress && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <small style={{ color: 'var(--muted)' }}>Địa chỉ chi nhánh</small>
                    <strong style={{ display: 'block', fontSize: 13 }}>{detailBooking.salonAddress}</strong>
                  </div>
                )}
                {detailBooking.note && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <small style={{ color: 'var(--muted)' }}>Ghi chú của khách</small>
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>{detailBooking.note}</p>
                  </div>
                )}
              </div>
            </div>

            <div
              className="admin-modal-actions"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                {detailBooking.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      className="solid-button"
                      style={{ background: '#2f6b45', borderColor: '#2f6b45' }}
                      disabled={busyId === detailBooking.id}
                      onClick={() => void handleAction(detailBooking, 'confirm')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                      {at('bkConfirmAction')}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                      disabled={busyId === detailBooking.id}
                      onClick={() => void handleAction(detailBooking, 'cancel')}
                    >
                      {at('bkCancelAction')}
                    </button>
                  </>
                )}
                {(detailBooking.status === 'CONFIRMED' || detailBooking.status === 'IN_SERVICE') && (
                  <>
                    <button
                      type="button"
                      className="solid-button"
                      disabled={busyId === detailBooking.id}
                      onClick={() => void handleAction(detailBooking, 'complete')}
                    >
                      {at('bkCompleteAction')}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                      disabled={busyId === detailBooking.id}
                      onClick={() => void handleAction(detailBooking, 'cancel')}
                    >
                      {at('bkCancelAction')}
                    </button>
                  </>
                )}
              </div>

              <button type="button" className="ghost-button" onClick={() => setDetailBooking(null)}>
                {at('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
