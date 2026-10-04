import { FormEvent, useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { Salon, Stylist } from '../../types/salon';
import { salonApi } from '../../services/api';

type StaffViewProps = {
  salon?: Salon;
};

export function StaffView({ salon }: StaffViewProps) {
  const { t } = useI18n();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [userId, setUserId] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const loadStylists = async () => {
    if (!salon) return;
    setStylists(await salonApi.getStylists(salon.id).catch(() => []));
  };

  useEffect(() => {
    void loadStylists();
  }, [salon?.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!salon) return;
    setSaving(true);
    setError(undefined);
    try {
      await salonApi.createStylist(salon.id, {
        userId: Number(userId),
        bio,
        experienceYears
      });
      setUserId('');
      setBio('');
      setExperienceYears(1);
      await loadStylists();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addStylistError'));
    } finally {
      setSaving(false);
    }
  };

  if (!salon) return <div className="empty-row">{t('createSalonBeforeStaff')}</div>;

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('staff')}</span>
          <h2>{t('staffTitle')}</h2>
          <p>{t('staffDesc')}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="two-column">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{t('addStylistTitle')}</h3>
              <p>{t('addStylistDesc')}</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={submit}>
            <label>
              {t('stylistAccountId')}
              <input value={userId} onChange={(event) => setUserId(event.target.value)} type="number" min={1} required />
            </label>
            <label>
              {t('bioRole')}
              <input value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Color specialist, senior stylist..." />
            </label>
            <label>
              {t('experienceYears')}
              <input value={experienceYears} onChange={(event) => setExperienceYears(Number(event.target.value))} type="number" min={0} />
            </label>
            <button className="solid-button" disabled={saving}>{saving ? t('saving') : t('addStylistButton')}</button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{t('currentStylists')}</h3>
              <p>{t('stylistsCount', { count: stylists.length })}</p>
            </div>
          </div>
          <div className="staff-grid">
            {stylists.length === 0 ? (
              <div className="empty-row">{t('noStylists')}</div>
            ) : (
              stylists.map((stylist) => (
                <div className="staff-card" key={stylist.id}>
                  <div className="staff-avatar">{stylist.avatarUrl ? <img src={stylist.avatarUrl} alt={stylist.fullName} /> : stylist.fullName?.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{stylist.fullName || `User #${stylist.userId}`}</strong>
                    <span>{stylist.bio || t('defaultStylist')}</span>
                    <small>{t('yearsExperience', { count: stylist.experienceYears || 0 })} • {stylist.status}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
