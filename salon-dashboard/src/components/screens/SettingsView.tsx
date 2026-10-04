import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { BusinessHour, Salon } from '../../types/salon';
import { SalonFormInput, salonApi } from '../../services/api';

type SettingsViewProps = {
  salon?: Salon;
  hasExistingSalons: boolean;
  onCancelCreate: () => void;
  onRefreshSalons: (preferredSalonId?: number) => Promise<void>;
};

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

export function SettingsView({ salon, hasExistingSalons, onCancelCreate, onRefreshSalons }: SettingsViewProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<SalonFormInput>({
    name: '',
    phone: '',
    address: '',
    description: '',
    imageUrl: ''
  });
  const [hours, setHours] = useState<BusinessHour[]>(createDefaultHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!salon) {
      setForm({ name: '', phone: '', address: '', description: '', imageUrl: '' });
      setHours(createDefaultHours());
      return;
    }

    setForm({
      name: salon.name || '',
      phone: salon.phone || '',
      address: salon.address || '',
      description: salon.description || '',
      imageUrl: salon.imageUrl || ''
    });
    setHours(salon.businessHours?.length ? salon.businessHours : createDefaultHours());
  }, [salon]);

  const title = useMemo(() => (salon ? t('updateBranch') : t('addNewBranch')), [salon, t]);

  const submitSalon = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      if (salon) {
        await salonApi.updateSalon(salon.id, form);
        await onRefreshSalons(salon.id);
      } else {
        const createdSalon = await salonApi.createSalon(form);
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
            <label>
              {t('address')}
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            <label>
              {t('imageUrl')}
              <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
            </label>
            <label className="span-2">
              {t('description')}
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <button className="solid-button" disabled={saving}>{saving ? t('saving') : salon ? t('saveBranch') : t('createBranch')}</button>
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
