import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { BusinessHour, Salon } from '../../types/salon';
import { SalonFormInput, salonApi } from '../../services/api';

type SettingsViewProps = {
  salon?: Salon;
  hasExistingSalons: boolean;
  onCancelCreate: () => void;
  onRefreshSalons: (preferredSalonId?: number) => Promise<void>;
};

const MAX_IMAGES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

const weekdays = [
  { dayOfWeek: 1, labelKey: 'monday' },
  { dayOfWeek: 2, labelKey: 'tuesday' },
  { dayOfWeek: 3, labelKey: 'wednesday' },
  { dayOfWeek: 4, labelKey: 'thursday' },
  { dayOfWeek: 5, labelKey: 'friday' },
  { dayOfWeek: 6, labelKey: 'saturday' },
  { dayOfWeek: 7, labelKey: 'sunday' }
];

function createDefaultHours(): BusinessHour[] {
  return weekdays.map((day) => ({
    dayOfWeek: day.dayOfWeek,
    openTime: '09:00',
    closeTime: '20:00',
    closed: false
  }));
}

const imagesOf = (item?: Salon) => (item?.imageUrls?.length ? item.imageUrls : item?.imageUrl ? [item.imageUrl] : []);

export function SettingsView({ salon, hasExistingSalons, onCancelCreate, onRefreshSalons }: SettingsViewProps) {
  const { t } = useI18n();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<SalonFormInput>({
    name: '',
    phone: '',
    address: '',
    description: '',
    imageUrl: '',
    imageUrls: []
  });
  const [images, setImages] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hours, setHours] = useState<BusinessHour[]>(createDefaultHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!salon) {
      setForm({ name: '', phone: '', address: '', description: '', imageUrl: '', imageUrls: [] });
      setImages([]);
      setLinkInput('');
      setHours(createDefaultHours());
      return;
    }

    const currentImages = imagesOf(salon);
    setForm({
      name: salon.name || '',
      phone: salon.phone || '',
      address: salon.address || '',
      description: salon.description || '',
      imageUrl: salon.imageUrl || '',
      imageUrls: currentImages
    });
    setImages(currentImages);
    setLinkInput('');
    setHours(salon.businessHours?.length ? salon.businessHours : createDefaultHours());
  }, [salon]);

  const slotsLeft = MAX_IMAGES - images.length;
  const title = useMemo(() => (salon ? t('updateBranch') : t('addNewBranch')), [salon, t]);

  const addImages = (newUrls: string[]) => {
    setImages((prev) => {
      const combined = [...prev];
      for (const url of newUrls) {
        if (!combined.includes(url) && combined.length < MAX_IMAGES) {
          combined.push(url);
        }
      }
      return combined;
    });
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Link ảnh phải bắt đầu bằng http:// hoặc https://');
      return;
    }
    if (images.includes(url)) {
      setError(t('imageDuplicateError'));
      return;
    }
    if (slotsLeft <= 0) {
      setError(t('imageMaxError', { max: MAX_IMAGES }));
      return;
    }
    setError(undefined);
    addImages([url]);
    setLinkInput('');
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setError(undefined);

    if (files.length > slotsLeft) {
      setError(t('imageMaxError', { max: MAX_IMAGES }));
      return;
    }
    const invalid = files.find((file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES);
    if (invalid) {
      setError(t('imageFileInvalidError', { name: invalid.name }));
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        uploaded.push(await salonApi.uploadSalonImage(file));
      }
      addImages(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('genericError'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const makeCover = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [picked] = copy.splice(index, 1);
      return [picked, ...copy];
    });
  };

  const submitSalon = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);

    const payload: SalonFormInput = {
      ...form,
      imageUrl: images[0] || '',
      imageUrls: images
    };

    try {
      if (salon) {
        await salonApi.updateSalon(salon.id, payload);
        await onRefreshSalons(salon.id);
      } else {
        const createdSalon = await salonApi.createSalon(payload);
        await onRefreshSalons(createdSalon.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveSalonError'));
    } finally {
      setSaving(false);
    }
  };

  const submitHours = async () => {
    if (!salon) return;
    setSaving(true);
    setError(undefined);
    try {
      await salonApi.updateBusinessHours(salon.id, hours);
      await onRefreshSalons();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveHoursError'));
    } finally {
      setSaving(false);
    }
  };

  const updateHour = (dayOfWeek: number, patch: Partial<BusinessHour>) => {
    setHours((current) => current.map((hour) => (hour.dayOfWeek === dayOfWeek ? { ...hour, ...patch } : hour)));
  };

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('settingsEyebrow')}</span>
          <h2>{t('branchProfile')}</h2>
          <p>{t('branchProfileDesc')}</p>
        </div>
        <div className="header-actions">
          {!salon && hasExistingSalons && (
            <button className="ghost-button" onClick={onCancelCreate}>
              {t('cancelCreate')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="two-column">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{title}</h3>
              <p>{salon ? t('editingSelectedBranch') : t('newBranchBelongsToOwner')}</p>
            </div>
          </div>

          <form className="form-grid" onSubmit={submitSalon}>
            <label>
              {t('branchName')}
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              {t('phone')}
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className="span-2">
              {t('address')}
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>

            <div className="span-2 image-manager">
              <div className="image-manager-head">
                <div>
                  <strong>{t('branchImages')}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                    {t('branchImagesDesc', { max: MAX_IMAGES })}
                  </p>
                </div>
                <span className={images.length >= MAX_IMAGES ? 'count-full' : ''}>
                  {images.length}/{MAX_IMAGES}
                </span>
              </div>

              {images.length > 0 && (
                <div className="image-grid" style={{ marginTop: '10px' }}>
                  {images.map((url, index) => (
                    <div className={`image-tile ${index === 0 ? 'cover' : ''}`} key={`${url}-${index}`}>
                      <img src={url} alt="" loading="lazy" />
                      {index === 0 && <span className="cover-badge">{t('coverImage')}</span>}
                      <div className="image-tile-actions">
                        {index !== 0 && (
                          <button type="button" className="mini" onClick={() => makeCover(index)}>
                            {t('makeCover')}
                          </button>
                        )}
                        <button type="button" className="mini danger" onClick={() => removeImage(index)}>
                          {t('removeImage')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="image-add" style={{ marginTop: '10px' }}>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(event) => void uploadFiles(event)}
                />
                <button
                  type="button"
                  className="ghost-button"
                  disabled={uploading || slotsLeft <= 0}
                  onClick={() => fileInput.current?.click()}
                >
                  {uploading ? t('uploadingImages') : `📎 ${t('attachImages')}`}
                </button>
                <input
                  type="url"
                  value={linkInput}
                  disabled={slotsLeft <= 0}
                  placeholder={t('linkPlaceholder')}
                  onChange={(event) => setLinkInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addLink();
                    }
                  }}
                />
                <button type="button" className="ghost-button" disabled={slotsLeft <= 0} onClick={addLink}>
                  {t('addLink')}
                </button>
              </div>
              <small className="field-hint">{t('imageRule', { max: MAX_IMAGES })}</small>
            </div>

            <label className="span-2">
              {t('description')}
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <button className="solid-button" disabled={saving || uploading}>
              {saving ? t('saving') : salon ? t('saveBranch') : t('createBranch')}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{t('businessHours')}</h3>
              <p>{t('businessHoursDesc')}</p>
            </div>
          </div>

          {!salon ? (
            <div className="empty-row">{t('createBranchBeforeHours')}</div>
          ) : (
            <>
              <div className="hours-list">
                {weekdays.map((day) => {
                  const hour = hours.find((item) => item.dayOfWeek === day.dayOfWeek) || {
                    dayOfWeek: day.dayOfWeek,
                    openTime: '09:00',
                    closeTime: '20:00',
                    closed: false
                  };
                  return (
                    <div className="hour-row" key={day.dayOfWeek}>
                      <strong>{t(day.labelKey)}</strong>
                      <label className="toggle-label">
                        <input type="checkbox" checked={!hour.closed} onChange={(event) => updateHour(day.dayOfWeek, { closed: !event.target.checked })} />
                        {t('open')}
                      </label>
                      <input type="time" value={hour.openTime || '09:00'} disabled={hour.closed} onChange={(event) => updateHour(day.dayOfWeek, { openTime: event.target.value })} />
                      <input type="time" value={hour.closeTime || '20:00'} disabled={hour.closed} onChange={(event) => updateHour(day.dayOfWeek, { closeTime: event.target.value })} />
                    </div>
                  );
                })}
              </div>
              <button className="solid-button" disabled={saving} onClick={() => void submitHours()}>
                {t('updateHours')}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
