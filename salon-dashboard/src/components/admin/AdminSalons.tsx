import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { GeoapifySalonOption, SalonFormInput, salonApi } from '../../services/api';
import { AdminOverview, AdminSalonStatus, CreateSalonOwnerInput } from '../../types/admin';
import { BusinessHour, Salon, UserAccount } from '../../types/salon';
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

const MAX_IMAGES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EMPTY_FORM: SalonFormInput = {
  name: '',
  phone: '',
  address: '',
  description: '',
  imageUrl: '',
  imageUrls: []
};

type GeoVerification = {
  loading: boolean;
  checked: boolean;
  match?: GeoapifySalonOption;
  candidateCount: number;
  error?: string;
};

const hasCoordinates = (salon?: Salon | null) =>
  Boolean(Number.isFinite(salon?.latitude) && Number.isFinite(salon?.longitude));

const hasGeoLink = (salon?: Salon | null) =>
  Boolean(salon?.geoapifyPlaceId && hasCoordinates(salon));

const isVerifiedCuratedLocation = (salon?: Salon | null) =>
  Boolean(
    salon?.listingSource === 'PLATFORM_CURATED' &&
      hasCoordinates(salon) &&
      salon.sourceUrl &&
      salon.sourcePlaceId &&
      salon.locationVerifiedAt
  );

const hasApprovalReadyLocation = (salon?: Salon | null) =>
  salon?.listingSource === 'PLATFORM_CURATED'
    ? isVerifiedCuratedLocation(salon)
    : hasGeoLink(salon);

const sourceLabel = (salon: Salon) => {
  if (salon.listingSource === 'PLATFORM_CURATED') return 'Google Maps đã khảo sát';
  if (salon.listingSource === 'GEOAPIFY_DEMO') return 'Geoapify DEMO';
  return hasGeoLink(salon) ? 'Geoapify đã liên kết' : 'Thiếu liên kết Geoapify';
};

const coordinatesMapUrl = (salon: Salon) =>
  salon.sourceUrl || (hasCoordinates(salon)
    ? `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`
    : undefined);

const imagesOf = (item?: Salon | null): string[] =>
  item?.imageUrls?.length ? item.imageUrls : item?.imageUrl ? [item.imageUrl] : [];

export function AdminSalons({ onNavigate: _onNavigate }: AdminSalonsProps) {
  const { date, language, t } = useI18n();
  const at = useAdminT();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [geoVerification, setGeoVerification] = useState<GeoVerification>({
    loading: false,
    checked: false,
    candidateCount: 0
  });

  // Modal Thêm / Sửa salon
  const [salonModalMode, setSalonModalMode] = useState<'edit' | null>(null);
  const [editingSalonId, setEditingSalonId] = useState<number | null>(null);
  const [salonForm, setSalonForm] = useState<SalonFormInput>(EMPTY_FORM);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingSalon, setSavingSalon] = useState(false);
  const [formError, setFormError] = useState<string>();

  // Modal cấp / gán tài khoản chủ salon
  const [assignOwnerSalon, setAssignOwnerSalon] = useState<Salon | null>(null);
  const [assignMode, setAssignMode] = useState<'create' | 'select'>('create');
  const [ownerUsers, setOwnerUsers] = useState<UserAccount[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number>();
  const [newOwnerForm, setNewOwnerForm] = useState<CreateSalonOwnerInput>({
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });
  const [assigningOwner, setAssigningOwner] = useState(false);
  const [assignError, setAssignError] = useState<string>();

  const openAssignOwnerModal = async (salon: Salon) => {
    setAssignOwnerSalon(salon);
    setAssignError(undefined);
    setAssignMode('create');
    setSelectedOwnerId(salon.ownerId);
    setNewOwnerForm({
      fullName: '',
      email: '',
      password: '',
      phone: salon.phone || ''
    });
    try {
      const res = await adminApi.getUsers('', 0, 100);
      const filtered = (res.content || []).filter((u) => u.roles?.includes('SALON_OWNER'));
      setOwnerUsers(filtered);
      if (filtered.length > 0 && !salon.ownerId) {
        setSelectedOwnerId(filtered[0].id);
      }
    } catch {
      // ignore
    }
  };

  const handleAssignOwnerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignOwnerSalon) return;
    setAssigningOwner(true);
    setAssignError(undefined);
    try {
      let updated: Salon;
      if (assignMode === 'create') {
        updated = await adminApi.assignSalonOwner(assignOwnerSalon.id, {
          createOwner: {
            fullName: newOwnerForm.fullName.trim(),
            email: newOwnerForm.email.trim(),
            password: newOwnerForm.password,
            phone: newOwnerForm.phone?.trim() || undefined
          }
        });
        setNotice(`Đã tạo tài khoản chủ salon (${newOwnerForm.email}) và gán cho salon "${assignOwnerSalon.name}"!`);
      } else {
        if (!selectedOwnerId) {
          throw new Error('Vui lòng chọn một tài khoản chủ salon từ danh sách');
        }
        updated = await adminApi.assignSalonOwner(assignOwnerSalon.id, {
          ownerId: selectedOwnerId
        });
        const matched = ownerUsers.find((u) => u.id === selectedOwnerId);
        setNotice(`Đã gán tài khoản chủ salon ${matched ? `${matched.fullName} (${matched.email})` : `#${selectedOwnerId}`} cho salon "${assignOwnerSalon.name}"!`);
      }
      setSalons((current) =>
        current.map((item) => (item.id === assignOwnerSalon.id ? { ...item, ...updated } : item))
      );
      if (detailSalon && detailSalon.id === assignOwnerSalon.id) {
        setDetailSalon((prev) => (prev ? { ...prev, ...updated } : null));
      }
      setAssignOwnerSalon(null);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setAssigningOwner(false);
    }
  };

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

  /* ────── Duyệt salon ────── */
  const handleApprove = async (salon: Salon) => {
    if (!hasApprovalReadyLocation(salon)) {
      setError(
        salon.listingSource === 'PLATFORM_CURATED'
          ? `Không thể phê duyệt ${salon.name}: địa điểm khảo sát chưa đủ URL/CID, tọa độ hoặc thời điểm xác minh.`
          : `Không thể phê duyệt ${salon.name}: Owner chưa liên kết địa điểm Geoapify hợp lệ.`
      );
      setDetailSalon(salon);
      return;
    }
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

  /* ────── Từ chối salon ────── */
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

  /* ────── Bật/tắt trạng thái salon ────── */
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

  /* ────── Xóa / Ngừng hoạt động salon ────── */
  const handleDeleteSalon = async (salon: Salon) => {
    if (!window.confirm(at('slDeleteConfirm', { name: salon.name }))) return;
    setBusyId(salon.id);
    setError(undefined);
    setNotice(undefined);
    try {
      await adminApi.deleteSalon(salon.id);
      setNotice(at('slDeleteSuccess', { name: salon.name }));
      if (detailSalon?.id === salon.id) {
        setDetailSalon(null);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  /* ────── Xem chi tiết salon ────── */
  const openDetail = async (salon: Salon) => {
    setDetailSalon(salon);
    setSelectedImage(salon.imageUrl || salon.imageUrls?.[0]);
    setGeoVerification({ loading: false, checked: false, candidateCount: 0 });
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

  const verifyGeoapifyLocation = async (salon: Salon) => {
    const query = [salon.name, salon.address].filter(Boolean).join(', ');
    if (!query) return;

    setGeoVerification({ loading: true, checked: false, candidateCount: 0 });
    try {
      const candidates = await salonApi.searchGeoapifySalons(query);
      const exactPlaceMatch = salon.geoapifyPlaceId
        ? candidates.find((candidate) => candidate.placeId === salon.geoapifyPlaceId)
        : undefined;
      const coordinateMatch = hasGeoLink(salon)
        ? candidates.find(
            (candidate) =>
              Math.abs(candidate.latitude - Number(salon.latitude)) < 0.0005 &&
              Math.abs(candidate.longitude - Number(salon.longitude)) < 0.0005
          )
        : undefined;

      setGeoVerification({
        loading: false,
        checked: true,
        match: exactPlaceMatch || coordinateMatch,
        candidateCount: candidates.length
      });
    } catch (err) {
      setGeoVerification({
        loading: false,
        checked: true,
        candidateCount: 0,
        error: err instanceof Error ? err.message : 'Không thể xác minh địa điểm Geoapify'
      });
    }
  };

  /* ────── Mở modal Thêm salon ────── */
  /* ────── Mở modal Sửa salon ────── */
  const openEditModal = (salon: Salon) => {
    const imgs = imagesOf(salon);
    setSalonModalMode('edit');
    setEditingSalonId(salon.id);
    setSalonForm({
      name: salon.name || '',
      phone: salon.phone || '',
      address: salon.address || '',
      description: salon.description || '',
      imageUrl: salon.imageUrl || '',
      imageUrls: imgs
    });
    setFormImages(imgs);
    setLinkInput('');
    setFormError(undefined);
  };

  /* ────── Thêm link ảnh ────── */
  const addImageLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setFormError('Link ảnh phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    if (formImages.includes(url)) {
      setFormError(t('imageDuplicateError'));
      return;
    }
    if (formImages.length >= MAX_IMAGES) {
      setFormError(t('imageMaxError', { max: MAX_IMAGES }));
      return;
    }
    setFormError(undefined);
    setFormImages((prev) => [...prev, url]);
    setLinkInput('');
  };

  /* ────── Upload file ảnh ────── */
  const handleUploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setFormError(undefined);

    const availableSlots = MAX_IMAGES - formImages.length;
    if (files.length > availableSlots) {
      setFormError(t('imageMaxError', { max: MAX_IMAGES }));
      return;
    }
    const invalid = files.find((file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES);
    if (invalid) {
      setFormError(t('imageFileInvalidError', { name: invalid.name }));
      return;
    }

    setUploadingImage(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await adminApi.uploadSalonImage(file));
      }
      setFormImages((prev) => {
        const next = [...prev];
        for (const u of uploaded) {
          if (!next.includes(u) && next.length < MAX_IMAGES) next.push(u);
        }
        return next;
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setUploadingImage(false);
    }
  };

  /* ────── Lưu form Thêm / Sửa salon ────── */
  const handleSubmitSalonForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!salonForm.name.trim()) {
      setFormError('Tên chi nhánh không được để trống');
      return;
    }

    setSavingSalon(true);
    setFormError(undefined);

    const payload: SalonFormInput = {
      name: salonForm.name.trim(),
      phone: salonForm.phone?.trim() || undefined,
      address: salonForm.address?.trim() || undefined,
      description: salonForm.description?.trim() || undefined,
      imageUrl: formImages[0] || '',
      imageUrls: formImages
    };

    try {
      if (editingSalonId) {
        const updated = await adminApi.updateSalon(editingSalonId, payload);
        setNotice(at('slEditSuccess', { name: updated.name }));
        if (detailSalon?.id === editingSalonId) {
          setDetailSalon((curr) => (curr ? { ...curr, ...updated } : null));
        }
      }
      setSalonModalMode(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setSavingSalon(false);
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
  const editingSalonIsCurated = Boolean(
    editingSalonId && salons.some(
      (salon) => salon.id === editingSalonId && salon.listingSource === 'PLATFORM_CURATED'
    )
  );

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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
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
              style={{ gridTemplateColumns: '1.8fr 1.6fr 1fr 1fr 1.8fr' }}
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
                    gridTemplateColumns: '1.8fr 1.6fr 1fr 1fr 1.8fr',
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            color: hasApprovalReadyLocation(salon) ? '#2f6b45' : '#9a5b15',
                            background: hasApprovalReadyLocation(salon) ? 'rgba(47,107,69,.1)' : 'rgba(185,91,18,.1)'
                          }}
                        >
                          {sourceLabel(salon)}
                        </span>
                        {salon.listingSource !== 'PLATFORM_CURATED' &&
                          (salon.listingSource === 'GEOAPIFY_DEMO' || salon.demo) && (
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#75500b',
                              background: 'rgba(212,160,23,.12)'
                            }}
                          >
                            DEMO
                          </span>
                        )}
                        {typeof salon.bookingEnabled === 'boolean' && (
                          <span
                            style={{
                              padding: '2px 7px',
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 700,
                              color: salon.bookingEnabled ? '#2f6b45' : '#8a3b32',
                              background: salon.bookingEnabled ? 'rgba(47,107,69,.1)' : 'rgba(192,57,43,.08)'
                            }}
                          >
                            {salon.bookingEnabled ? 'Có thể đặt lịch' : 'Chưa nhận lịch'}
                          </span>
                        )}
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
                          disabled={isBusy || !hasApprovalReadyLocation(salon)}
                          onClick={() => void handleApprove(salon)}
                          title={hasApprovalReadyLocation(salon)
                            ? at('slApprove')
                            : salon.listingSource === 'PLATFORM_CURATED'
                              ? 'Salon khảo sát phải có URL/CID, tọa độ và thời điểm xác minh'
                              : 'Owner phải liên kết Geoapify trước khi được duyệt'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
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
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
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
                        onClick={() => void handleToggleStatus(salon, 'PENDING_APPROVAL')}
                        title="Đưa salon về chờ duyệt để kiểm tra lại điều kiện vị trí"
                      >
                        Đưa về chờ duyệt
                      </button>
                    )}

                    {/* Cấp / Gán tài khoản chủ salon */}
                    <button
                      type="button"
                      className="ghost-button mini"
                      style={{ color: '#2b5c8f', borderColor: 'rgba(43, 92, 143, 0.3)' }}
                      disabled={isBusy}
                      onClick={() => void openAssignOwnerModal(salon)}
                      title="Cấp / Gán tài khoản chủ salon"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                      Tài khoản
                    </button>

                    {/* Sửa salon */}
                    <button
                      type="button"
                      className="ghost-button mini"
                      disabled={isBusy}
                      onClick={() => openEditModal(salon)}
                      title={at('slEdit')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      {at('edit')}
                    </button>

                    {/* Xóa salon */}
                    <button
                      type="button"
                      className="ghost-button mini"
                      style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                      disabled={isBusy}
                      onClick={() => void handleDeleteSalon(salon)}
                      title={at('slDelete')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>

                    {/* Chi tiết salon */}
                    <button
                      type="button"
                      className="ghost-button mini"
                      onClick={() => void openDetail(salon)}
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

        {/* Phân trang */}
        <Pager page={pageNo} totalPages={totalPages} onChange={setPageNo} />
      </section>

      {/* ═══════════════ MODAL THÊM / SỬA SALON ═══════════════ */}
      {salonModalMode && (
        <div className="admin-modal-backdrop" onClick={() => !savingSalon && setSalonModalMode(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <div>
                <h3>{at('slEditTitle', { id: editingSalonId || '' })}</h3>
                <p>Cập nhật trực tiếp lên hệ thống qua API backend</p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={savingSalon}
                onClick={() => setSalonModalMode(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="admin-modal-body">
              {formError && <div className="error-banner">{formError}</div>}

              <form className="form-grid" onSubmit={handleSubmitSalonForm}>
                <label className="full">
                  {at('slBranchName')} *
                  <input
                    value={salonForm.name}
                    onChange={(e) => setSalonForm({ ...salonForm, name: e.target.value })}
                    required
                    placeholder="VD: StyleLock Quận 1"
                    autoFocus
                  />
                </label>

                <label>
                  {at('slPhone')}
                  <input
                    type="tel"
                    value={salonForm.phone || ''}
                    onChange={(e) => setSalonForm({ ...salonForm, phone: e.target.value })}
                    placeholder="0901234567"
                  />
                </label>

                <label>
                  {at('slAddress')}
                  <input
                    value={salonForm.address || ''}
                    readOnly={editingSalonIsCurated}
                    onChange={(e) => setSalonForm({ ...salonForm, address: e.target.value })}
                    placeholder="123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM"
                  />
                  {editingSalonIsCurated && (
                    <small className="field-hint">
                      Địa chỉ khảo sát được khóa theo Google Maps CID/URL đã xác minh.
                    </small>
                  )}
                </label>

                <label className="full">
                  {at('ctDescription')}
                  <textarea
                    rows={3}
                    value={salonForm.description || ''}
                    onChange={(e) => setSalonForm({ ...salonForm, description: e.target.value })}
                    placeholder="Mô tả về dịch vụ, phong cách, đội ngũ chuyên gia của chi nhánh..."
                  />
                </label>

                {/* Quản lý hình ảnh chi nhánh */}
                <div className="full image-manager" style={{ marginTop: 6 }}>
                  <div className="image-manager-head">
                    <div>
                      <strong>{at('slImages')}</strong>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                        Tối đa {MAX_IMAGES} ảnh. Ảnh đầu tiên là ảnh bìa chi nhánh hiển thị trên app.
                      </p>
                    </div>
                    <span className={formImages.length >= MAX_IMAGES ? 'count-full' : ''}>
                      {formImages.length}/{MAX_IMAGES}
                    </span>
                  </div>

                  {formImages.length > 0 && (
                    <div className="image-grid" style={{ marginTop: 10 }}>
                      {formImages.map((url, idx) => (
                        <div className={`image-tile ${idx === 0 ? 'cover' : ''}`} key={`${url}-${idx}`}>
                          <img src={url} alt={`Ảnh ${idx + 1}`} loading="lazy" />
                          {idx === 0 && <span className="cover-badge">{t('coverImage')}</span>}
                          <div className="image-tile-actions">
                            {idx !== 0 && (
                              <button
                                type="button"
                                className="mini"
                                onClick={() => {
                                  setFormImages((prev) => {
                                    const copy = [...prev];
                                    const [picked] = copy.splice(idx, 1);
                                    return [picked, ...copy];
                                  });
                                }}
                              >
                                {t('makeCover')}
                              </button>
                            )}
                            <button
                              type="button"
                              className="mini danger"
                              onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              {t('removeImage')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="image-add" style={{ marginTop: 10 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      hidden
                      onChange={(e) => void handleUploadFiles(e)}
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={uploadingImage || formImages.length >= MAX_IMAGES}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? t('uploadingImages') : `📎 ${t('attachImages')}`}
                    </button>
                    <input
                      type="url"
                      value={linkInput}
                      disabled={formImages.length >= MAX_IMAGES}
                      placeholder={t('linkPlaceholder')}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addImageLink();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={formImages.length >= MAX_IMAGES}
                      onClick={addImageLink}
                    >
                      {t('addLink')}
                    </button>
                  </div>
                </div>

                <div className="admin-modal-actions full" style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={savingSalon || uploadingImage}
                    onClick={() => setSalonModalMode(null)}
                  >
                    {at('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="solid-button"
                    disabled={savingSalon || uploadingImage}
                  >
                    {savingSalon ? at('saving') : at('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL CHI TIẾT CHI NHÁNH ═══════════════ */}
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

              {/* Nguồn địa điểm thật dùng khi duyệt chi nhánh */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: `1px solid ${hasApprovalReadyLocation(detailSalon) ? 'rgba(47,107,69,.28)' : 'rgba(185,91,18,.32)'}`,
                  background: hasApprovalReadyLocation(detailSalon) ? 'rgba(47,107,69,.05)' : 'rgba(185,91,18,.06)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ display: 'block', color: 'var(--ink)' }}>Nguồn dữ liệu địa điểm thực</strong>
                    <small style={{ color: 'var(--muted)' }}>
                      {detailSalon.listingSource === 'PLATFORM_CURATED'
                        ? isVerifiedCuratedLocation(detailSalon)
                          ? 'StyleLock đã khảo sát và xác minh địa điểm từ Google Maps.'
                          : 'Salon khảo sát chưa đủ URL/CID, tọa độ hoặc thời điểm xác minh.'
                        : hasGeoLink(detailSalon)
                          ? 'Owner đã liên kết chi nhánh với một địa điểm thật trên Geoapify.'
                          : 'Chưa có Geoapify Place ID hoặc tọa độ hợp lệ. Chi nhánh này chưa thể được phê duyệt.'}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {coordinatesMapUrl(detailSalon) && (
                      <a
                        className="ghost-button mini"
                        href={coordinatesMapUrl(detailSalon)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>map</span>
                        Mở bản đồ
                      </a>
                    )}
                    <button
                      type="button"
                      className="ghost-button mini"
                      disabled={
                        geoVerification.loading ||
                        !hasGeoLink(detailSalon) ||
                        detailSalon.listingSource === 'PLATFORM_CURATED'
                      }
                      onClick={() => void verifyGeoapifyLocation(detailSalon)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>travel_explore</span>
                      {geoVerification.loading ? 'Đang xác minh...' : 'Xác minh Geoapify'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 4, marginTop: 10, fontSize: 12 }}>
                    <span><strong>Nguồn:</strong> {sourceLabel(detailSalon)}</span>
                    {detailSalon.listingSource === 'PLATFORM_CURATED' ? (
                      <>
                        <span>
                          <strong>Google Maps CID/Place ID:</strong>{' '}
                          <code style={{ wordBreak: 'break-all' }}>{detailSalon.sourcePlaceId || 'Chưa có'}</code>
                        </span>
                        <span>
                          <strong>URL nguồn:</strong>{' '}
                          {detailSalon.sourceUrl ? (
                            <a href={detailSalon.sourceUrl} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>
                              {detailSalon.sourceUrl}
                            </a>
                          ) : 'Chưa có'}
                        </span>
                        <span>
                          <strong>Xác minh lúc:</strong>{' '}
                          {detailSalon.locationVerifiedAt ? date(detailSalon.locationVerifiedAt) : 'Chưa có'}
                        </span>
                      </>
                    ) : detailSalon.geoapifyPlaceId ? (
                      <span>
                        <strong>Geoapify Place ID:</strong>{' '}
                        <code style={{ wordBreak: 'break-all' }}>{detailSalon.geoapifyPlaceId}</code>
                      </span>
                    ) : null}
                    {hasCoordinates(detailSalon) && (
                      <span>
                        <strong>Tọa độ:</strong> {Number(detailSalon.latitude).toFixed(6)}, {Number(detailSalon.longitude).toFixed(6)}
                      </span>
                    )}
                    {typeof detailSalon.bookingEnabled === 'boolean' && (
                      <span>
                        <strong>Nhận đặt lịch:</strong>{' '}
                        <span style={{ color: detailSalon.bookingEnabled ? '#2f6b45' : '#8a3b32', fontWeight: 700 }}>
                          {detailSalon.bookingEnabled ? 'Đã bật' : 'Chưa bật'}
                        </span>
                      </span>
                    )}
                </div>

                {detailSalon.listingSource !== 'PLATFORM_CURATED' && geoVerification.checked && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '8px 10px',
                      borderRadius: 10,
                      fontSize: 12,
                      color: geoVerification.error || !geoVerification.match ? '#9a5b15' : '#2f6b45',
                      background: geoVerification.error || !geoVerification.match ? 'rgba(185,91,18,.08)' : 'rgba(47,107,69,.08)'
                    }}
                  >
                    {geoVerification.error
                      ? `Không thể xác minh: ${geoVerification.error}`
                      : geoVerification.match
                        ? `Đã đối chiếu với Geoapify: ${geoVerification.match.name} — ${geoVerification.match.address || 'không có địa chỉ'}`
                        : `Geoapify trả về ${geoVerification.candidateCount} địa điểm gần đó nhưng chưa tìm thấy Place ID/tọa độ trùng. Vui lòng kiểm tra thủ công trước khi duyệt.`}
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

              {/* Hành động phê duyệt / từ chối nếu PENDING */}
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
                      disabled={busyId === detailSalon.id || !hasApprovalReadyLocation(detailSalon)}
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

            {/* Modal footer: Sửa, Xóa, Đóng */}
            <div
              className="admin-modal-actions"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="ghost-button mini"
                  style={{ color: '#2b5c8f', borderColor: 'rgba(43, 92, 143, 0.3)' }}
                  onClick={() => {
                    const current = detailSalon;
                    openAssignOwnerModal(current);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                  Cấp / Đổi chủ salon
                </button>
                <button
                  type="button"
                  className="solid-button mini"
                  onClick={() => {
                    const current = detailSalon;
                    setDetailSalon(null);
                    openEditModal(current);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  {at('slEdit')}
                </button>
                <button
                  type="button"
                  className="ghost-button mini"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(192, 57, 43, 0.3)' }}
                  onClick={() => void handleDeleteSalon(detailSalon)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  {at('slDelete')}
                </button>
              </div>

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

      {/* Modal Cấp / Gán tài khoản chủ salon */}
      {assignOwnerSalon && (
        <div className="admin-modal-backdrop" onClick={() => !assigningOwner && setAssignOwnerSalon(null)}>
          <div className="admin-modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>Cấp tài khoản chủ salon</h3>
                <p>
                  Salon: <strong>{assignOwnerSalon.name}</strong> (#{assignOwnerSalon.id})
                  {assignOwnerSalon.ownerId ? ` · Mã chủ hiện tại: #${assignOwnerSalon.ownerId}` : ' · Chưa có chủ'}
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={assigningOwner}
                onClick={() => setAssignOwnerSalon(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="admin-modal-body">
              {assignError && <div className="error-banner">{assignError}</div>}

              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  className={assignMode === 'create' ? 'solid-button mini' : 'ghost-button mini'}
                  onClick={() => setAssignMode('create')}
                >
                  + Tạo tài khoản mới
                </button>
                <button
                  type="button"
                  className={assignMode === 'select' ? 'solid-button mini' : 'ghost-button mini'}
                  onClick={() => setAssignMode('select')}
                >
                  Chọn tài khoản có sẵn ({ownerUsers.length})
                </button>
              </div>

              {assignMode === 'create' ? (
                <form className="form-grid" onSubmit={handleAssignOwnerSubmit}>
                  <label className="full">
                    Họ và tên chủ salon
                    <input
                      value={newOwnerForm.fullName}
                      onChange={(e) => setNewOwnerForm({ ...newOwnerForm, fullName: e.target.value })}
                      required
                      placeholder="Nguyễn Văn A"
                      autoFocus
                    />
                  </label>
                  <label className="full">
                    Email đăng nhập
                    <input
                      type="email"
                      value={newOwnerForm.email}
                      onChange={(e) => setNewOwnerForm({ ...newOwnerForm, email: e.target.value })}
                      required
                      placeholder="owner@gmail.com"
                    />
                  </label>
                  <label className="full">
                    Mật khẩu khởi tạo
                    <input
                      type="password"
                      value={newOwnerForm.password}
                      onChange={(e) => setNewOwnerForm({ ...newOwnerForm, password: e.target.value })}
                      required
                      minLength={8}
                      placeholder="Tối thiểu 8 ký tự (VD: Password@123)"
                    />
                  </label>
                  <label className="full">
                    Số điện thoại (tùy chọn)
                    <input
                      type="tel"
                      value={newOwnerForm.phone || ''}
                      onChange={(e) => setNewOwnerForm({ ...newOwnerForm, phone: e.target.value })}
                      placeholder="0912345678"
                    />
                  </label>

                  <div className="admin-modal-actions full" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={assigningOwner}
                      onClick={() => setAssignOwnerSalon(null)}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="solid-button" disabled={assigningOwner}>
                      {assigningOwner ? 'Đang tạo & gán...' : 'Tạo & Gán tài khoản chủ salon'}
                    </button>
                  </div>
                </form>
              ) : (
                <form className="form-grid" onSubmit={handleAssignOwnerSubmit}>
                  <label className="full">
                    Chọn chủ salon đã có
                    <select
                      value={selectedOwnerId || ''}
                      onChange={(e) => setSelectedOwnerId(Number(e.target.value))}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--line)',
                        background: 'var(--surface)',
                        color: 'var(--ink)'
                      }}
                    >
                      <option value="">-- Chọn tài khoản chủ salon --</option>
                      {ownerUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          #{u.id} - {u.fullName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </label>

                  {ownerUsers.length === 0 && (
                    <p style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0' }}>
                      Chưa có tài khoản nào có role SALON_OWNER trong hệ thống. Vui lòng chuyển sang tab "+ Tạo tài khoản mới".
                    </p>
                  )}

                  <div className="admin-modal-actions full" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={assigningOwner}
                      onClick={() => setAssignOwnerSalon(null)}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="solid-button"
                      disabled={assigningOwner || !selectedOwnerId}
                    >
                      {assigningOwner ? 'Đang gán...' : 'Gán quyền chủ salon'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
