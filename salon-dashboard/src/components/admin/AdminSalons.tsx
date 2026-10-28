import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminOverview, AdminSalonStatus } from '../../types/admin';
import { BusinessHour, Salon } from '../../types/salon';
import { Pager, StatusPill } from './AdminParts';

type AdminSalonsProps = {
  onNavigate?: (tab: any) => void;
};

const FILTERS: { key: AdminSalonStatus | ''; labelKey: string }[] = [
  { key: '', labelKey: 'all' },
  { key: 'PENDING_APPROVAL', labelKey: 'st_PENDING_APPROVAL' },
  { key: 'ACTIVE', labelKey: 'st_ACTIVE' },
  { key: 'INACTIVE', labelKey: 'st_INACTIVE' }
];

const DAY_NAMES_VI: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật'
};

const DAY_NAMES_EN: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun'
};

export function AdminSalons({ onNavigate: _onNavigate }: AdminSalonsProps) {
  const { date, language } = useI18n();
  const at = useAdminT();
  const [filter, setFilter] = useState<AdminSalonStatus | ''>('');
  const [search, setSearch] = useState('');
  const [pageNo, setPageNo] = useState(0);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busyId, setBusyId] = useState<number>();
  const [overview, setOverview] = useState<AdminOverview>();

  // Modal chi tiết salon
  const [detailSalon, setDetailSalon] = useState<Salon | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>();

  const loadOverview = async () => {
    try {
      const ov = await adminApi.getOverview();
      setOverview(ov);
    } catch {
      // ignore
    }
  };

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [result] = await Promise.all([
        adminApi.getSalons(filter, pageNo, 10),
        loadOverview()
      ]);
      setSalons(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter, pageNo]);

  const changeFilter = (next: AdminSalonStatus | '') => {
    setPageNo(0);
    setFilter(next);
  };

  const handleApprove = async (salon: Salon) => {
    if (!window.confirm(at('slApproveConfirm', { name: salon.name }))) return;
    setBusyId(salon.id);
    setError(undefined);
    setNotice(undefined);
    try {
      const updated = await adminApi.approveSalon(salon.id);
      setSalons((current) => current.map((item) => (item.id === salon.id ? { ...item, ...updated } : item)));
      if (detailSalon?.id === salon.id) {
        setDetailSalon((curr) => (curr ? { ...curr, ...updated, status: 'ACTIVE' } : null));
      }
      setNotice(at('slApproveSuccess', { name: salon.name }));
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  const handleReject = async (salon: Salon) => {
    if (!window.confirm(at('slRejectConfirm', { name: salon.name }))) return;
    setBusyId(salon.id);
    setError(undefined);
    setNotice(undefined);
    try {
      const updated = await adminApi.rejectSalon(salon.id);
      setSalons((current) => current.map((item) => (item.id === salon.id ? { ...item, ...updated } : item)));
      if (detailSalon?.id === salon.id) {
        setDetailSalon((curr) => (curr ? { ...curr, ...updated, status: 'INACTIVE' } : null));
      }
      setNotice(at('slRejectSuccess', { name: salon.name }));
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  const handleToggleStatus = async (salon: Salon, targetStatus: AdminSalonStatus) => {
    const statusLabel = at(`st_${targetStatus}`);
    if (!window.confirm(at('slStatusChangeConfirm', { name: salon.name, status: statusLabel }))) return;
    setBusyId(salon.id);
    setError(undefined);
    setNotice(undefined);
    try {
      const updated = await adminApi.updateSalonStatus(salon.id, targetStatus);
      setSalons((current) => current.map((item) => (item.id === salon.id ? { ...item, ...updated } : item)));
      if (detailSalon?.id === salon.id) {
        setDetailSalon((curr) => (curr ? { ...curr, ...updated, status: targetStatus } : null));
      }
      setNotice(at('slStatusChangeSuccess', { name: salon.name }));
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  const openDetail = async (salon: Salon) => {
    setDetailSalon(salon);
    setSelectedImage(salon.imageUrl || salon.imageUrls?.[0]);
    setLoadingDetail(true);
    try {
      const full = await adminApi.getSalonDetail(salon.id);
      setDetailSalon(full);
      setSelectedImage(full.imageUrl || full.imageUrls?.[0]);
    } catch {
      // Giữ nguyên thông tin salon cơ bản nếu gọi detail bị lỗi
    } finally {
      setLoadingDetail(false);
    }
  };

  // Lọc tìm kiếm phía client
  const displayedSalons = useMemo(() => {
    if (!search.trim()) return salons;
    const q = search.trim().toLowerCase();
    return salons.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        String(s.ownerId).includes(q)
    );
  }, [salons, search]);

  const pendingCount = overview?.pendingApprovalSalons ?? 0;
  const activeCount = overview?.activeSalons ?? 0;
  const totalSalons = overview?.totalSalons ?? totalElements;
  const inactiveCount = Math.max(0, totalSalons - activeCount - pendingCount);

  return (
    <div className="screen-stack">
      {/* Tiêu đề màn hình */}
      <div className="screen-header">
        <div>
          <span className="eyebrow">{at('tabSalons')}</span>
          <h2>{at('slTitle')}</h2>
          <p>
            {at('slDesc')} · {at('slTotal', { count: totalElements })}
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-button" onClick={() => void load()}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              refresh
            </span>
            {loading ? at('loading') : at('refresh')}
          </button>
        </div>
      </div>

      {/* Thông báo lỗi & thành công */}
      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {/* Cảnh báo chi nhánh chờ duyệt nổi bật */}
      {pendingCount > 0 && filter !== 'PENDING_APPROVAL' && (
        <div className="admin-callout admin-callout-pending">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined callout-icon" style={{ fontSize: 32, color: 'var(--brand)' }}>
              pending_actions
            </span>
            <div>
              <strong style={{ fontSize: 16 }}>{at('slPendingAlertTitle', { count: pendingCount })}</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {at('slPendingAlertDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="solid-button mini"
            onClick={() => changeFilter('PENDING_APPROVAL')}
          >
            {at('slPendingReviewNow')}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </button>
        </div>
      )}

      {/* Thẻ thống kê nhanh */}
      <div className="metrics-grid admin-metrics">
        <div
          className={`metric-card clickable ${filter === '' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('slTotalSalons')}</span>
            <strong>{totalSalons}</strong>
            <small>{at('all')}</small>
          </div>
          <span className="material-symbols-outlined">storefront</span>
        </div>

        <div
          className={`metric-card clickable ${pendingCount > 0 ? 'warning' : ''} ${filter === 'PENDING_APPROVAL' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('PENDING_APPROVAL')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('slPendingSalons')}</span>
            <strong style={pendingCount > 0 ? { color: '#b95b12' } : {}}>{pendingCount}</strong>
            <small>{pendingCount > 0 ? at('st_PENDING_APPROVAL') : at('hintSalons')}</small>
          </div>
          <span className="material-symbols-outlined" style={pendingCount > 0 ? { color: '#b95b12' } : {}}>
            pending_actions
          </span>
        </div>

        <div
          className={`metric-card clickable success ${filter === 'ACTIVE' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('ACTIVE')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('slActiveSalons')}</span>
            <strong>{activeCount}</strong>
            <small>{at('st_ACTIVE')}</small>
          </div>
          <span className="material-symbols-outlined">check_circle</span>
        </div>

        <div
          className={`metric-card clickable ${filter === 'INACTIVE' ? 'active-metric' : ''}`}
          onClick={() => changeFilter('INACTIVE')}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span>{at('slInactiveSalons')}</span>
            <strong>{inactiveCount}</strong>
            <small>{at('st_INACTIVE')}</small>
          </div>
          <span className="material-symbols-outlined">pause_circle</span>
        </div>
      </div>

      {/* Bảng danh sách chi nhánh */}
      <section className="panel">
        <div className="panel-head" style={{ flexWrap: 'wrap', gap: 12 }}>
          {/* Bộ lọc trạng thái */}
          <div className="filter-pills">
            {FILTERS.map((f) => {
              const count =
                f.key === ''
                  ? totalSalons
                  : f.key === 'PENDING_APPROVAL'
                  ? pendingCount
                  : f.key === 'ACTIVE'
                  ? activeCount
                  : inactiveCount;
              return (
                <button
                  key={f.key}
                  type="button"
                  className={`pill-button ${filter === f.key ? 'active' : ''}`}
                  onClick={() => changeFilter(f.key)}
                >
                  {at(f.labelKey)} {count > 0 && <span className="pill-badge">({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Ô tìm kiếm */}
          <div style={{ position: 'relative', minWidth: 260 }}>
            <input
              type="text"
              placeholder={at('slSearchPlaceholder')}
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

        {/* Nội dung danh sách */}
        {loading ? (
          <div className="empty-row">{at('loading')}</div>
        ) : displayedSalons.length === 0 ? (
          <div className="empty-row">
            {filter === 'PENDING_APPROVAL' ? at('slEmptyPending') : at('slEmpty')}
          </div>
        ) : (
          <div className="table-wrapper">
            <div
              className="table-header"
              style={{ gridTemplateColumns: '1.8fr 1.6fr 1fr 1fr 1.4fr' }}
            >
              <span>{at('slBranchName')}</span>
              <span>{at('slAddress')}</span>
              <span>{at('created')}</span>
              <span>{at('status')}</span>
              <span style={{ textAlign: 'right' }}>{at('actions')}</span>
            </div>

            {displayedSalons.map((salon) => {
              const isPending = salon.status === 'PENDING_APPROVAL';
              const isActive = salon.status === 'ACTIVE';
              const isInactive = salon.status === 'INACTIVE';
              const isBusy = busyId === salon.id;
              const coverImg = salon.imageUrl || salon.imageUrls?.[0];

              return (
                <div
                  key={salon.id}
                  className="table-row"
                  style={{
                    gridTemplateColumns: '1.8fr 1.6fr 1fr 1fr 1.4fr',
                    alignItems: 'center',
                    background: isPending ? 'rgba(234, 215, 191, 0.12)' : undefined
                  }}
                >
                  {/* Cột Chi nhánh: ảnh + tên + ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {coverImg ? (
                      <img
                        className="admin-thumb"
                        src={coverImg}
                        alt={salon.name}
                        style={{ border: '1px solid var(--line)' }}
                      />
                    ) : (
                      <div
                        className="admin-thumb"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--surface-soft)',
                          color: 'var(--muted)',
                          border: '1px solid var(--line)'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                          storefront
                        </span>
                      </div>
                    )}
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{salon.name}</strong>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        <span>#{salon.id}</span>
                        {salon.ownerId && <span>· {at('slOwnerId', { id: salon.ownerId })}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Cột Địa chỉ & SĐT */}
                  <div style={{ fontSize: 13 }}>
                    <div style={{ color: 'var(--ink)' }}>{salon.address || '—'}</div>
                    {salon.phone && (
                      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }}>
                          call
                        </span>
                        {salon.phone}
                      </div>
                    )}
                  </div>

                  {/* Cột Ngày tạo */}
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {salon.createdAt ? date(salon.createdAt) : '—'}
                  </div>

                  {/* Cột Trạng thái */}
                  <div>
                    <StatusPill status={salon.status} label={at(`st_${salon.status || 'INACTIVE'}`)} />
                  </div>

                  {/* Cột Thao tác */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          className="solid-button mini"
                          style={{ background: '#2f6b45', color: '#fff', borderColor: '#2f6b45' }}
                          disabled={isBusy}
                          onClick={() => void handleApprove(salon)}
                          title={at('slApprove')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            check
                          </span>
                          {at('slApprove')}
                        </button>
                        <button
                          type="button"
                          className="ghost-button mini"
                          style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                          disabled={isBusy}
                          onClick={() => void handleReject(salon)}
                          title={at('slReject')}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            close
                          </span>
                          {at('slReject')}
                        </button>
                      </>
                    )}

                    {isActive && (
                      <button
                        type="button"
                        className="ghost-button mini"
                        disabled={isBusy}
                        onClick={() => void handleToggleStatus(salon, 'INACTIVE')}
                        title={at('slDeactivate')}
                      >
                        {at('slDeactivate')}
                      </button>
                    )}

                    {isInactive && (
                      <button
                        type="button"
                        className="ghost-button mini"
                        disabled={isBusy}
                        onClick={() => void handleToggleStatus(salon, 'ACTIVE')}
                        title={at('slActivate')}
                      >
                        {at('slActivate')}
                      </button>
                    )}

                    <button
                      type="button"
                      className="ghost-button mini"
                      onClick={() => void openDetail(salon)}
                      title={at('slViewDetail')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        visibility
                      </span>
                      {at('slViewDetail')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phân trang */}
        <Pager page={pageNo} totalPages={totalPages} onChange={setPageNo} />
      </section>

      {/* Modal chi tiết chi nhánh */}
      {detailSalon && (
        <div className="admin-modal-backdrop" onClick={() => setDetailSalon(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="admin-modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3>{detailSalon.name}</h3>
                  <StatusPill
                    status={detailSalon.status}
                    label={at(`st_${detailSalon.status || 'INACTIVE'}`)}
                  />
                </div>
                <p>
                  #{detailSalon.id}
                  {detailSalon.ownerId && ` · ${at('slOwnerId', { id: detailSalon.ownerId })}`}
                  {detailSalon.createdAt && ` · ${date(detailSalon.createdAt)}`}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDetailSalon(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="admin-modal-body" style={{ display: 'grid', gap: 20 }}>
              {/* Hình ảnh chi nhánh */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                  {at('slImages')} ({detailSalon.imageUrls?.length || (detailSalon.imageUrl ? 1 : 0)})
                </label>
                {selectedImage ? (
                  <div style={{ marginBottom: 10 }}>
                    <img
                      src={selectedImage}
                      alt={detailSalon.name}
                      style={{
                        width: '100%',
                        maxHeight: 240,
                        objectFit: 'cover',
                        borderRadius: 14,
                        border: '1px solid var(--line)'
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      height: 120,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--surface-soft)',
                      borderRadius: 14,
                      color: 'var(--muted)',
                      fontSize: 13
                    }}
                  >
                    Chưa có hình ảnh
                  </div>
                )}

                {/* Thumbnails nếu có nhiều ảnh */}
                {detailSalon.imageUrls && detailSalon.imageUrls.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {detailSalon.imageUrls.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Ảnh ${idx + 1}`}
                        onClick={() => setSelectedImage(img)}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: selectedImage === img ? '2px solid var(--brand)' : '1px solid var(--line)',
                          opacity: selectedImage === img ? 1 : 0.7
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin liên hệ & địa chỉ */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 14,
                  padding: 14,
                  background: 'var(--surface-soft)',
                  borderRadius: 14
                }}
              >
                <div>
                  <small style={{ color: 'var(--muted)', display: 'block', marginBottom: 2 }}>
                    {at('slPhone')}
                  </small>
                  <strong>{detailSalon.phone || 'Chưa cung cấp'}</strong>
                </div>
                <div>
                  <small style={{ color: 'var(--muted)', display: 'block', marginBottom: 2 }}>
                    {at('slAddress')}
                  </small>
                  <strong>{detailSalon.address || 'Chưa cung cấp'}</strong>
                </div>
                {detailSalon.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <small style={{ color: 'var(--muted)', display: 'block', marginBottom: 2 }}>
                      {at('ctDescription')}
                    </small>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-line' }}>
                      {detailSalon.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Giờ mở cửa */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>
                  {at('slBusinessHours')}
                </label>
                {loadingDetail ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{at('loading')}</div>
                ) : !detailSalon.businessHours || detailSalon.businessHours.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{at('slNoBusinessHours')}</div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: 8
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                      const hour = detailSalon.businessHours?.find((h: BusinessHour) => h.dayOfWeek === dayNum);
                      const dayName = language === 'vi' ? DAY_NAMES_VI[dayNum] : DAY_NAMES_EN[dayNum];
                      return (
                        <div
                          key={dayNum}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: hour?.closed ? 'rgba(0,0,0,0.03)' : 'var(--surface)',
                            border: '1px solid var(--line)',
                            fontSize: 12
                          }}
                        >
                          <strong style={{ display: 'block', color: 'var(--ink)', marginBottom: 2 }}>
                            {dayName}
                          </strong>
                          {hour?.closed ? (
                            <span style={{ color: 'var(--muted)' }}>{at('slClosed')}</span>
                          ) : hour?.openTime && hour?.closeTime ? (
                            <span style={{ color: '#2f6b45', fontWeight: 600 }}>
                              {hour.openTime.slice(0, 5)} - {hour.closeTime.slice(0, 5)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)' }}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hành động phê duyệt / từ chối trong modal */}
              {detailSalon.status === 'PENDING_APPROVAL' && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    background: '#fef7ed',
                    border: '1px solid #ead7bf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <strong style={{ color: '#b95b12', display: 'block' }}>
                      {at('st_PENDING_APPROVAL')}
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Vui lòng kiểm tra kỹ thông tin trước khi phê duyệt chi nhánh.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="solid-button"
                      style={{ background: '#2f6b45', borderColor: '#2f6b45' }}
                      disabled={busyId === detailSalon.id}
                      onClick={() => void handleApprove(detailSalon)}
                    >
                      <span className="material-symbols-outlined">check</span>
                      {at('slApprove')}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                      disabled={busyId === detailSalon.id}
                      onClick={() => void handleReject(detailSalon)}
                    >
                      <span className="material-symbols-outlined">close</span>
                      {at('slReject')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="admin-modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setDetailSalon(null)}
              >
                {at('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
