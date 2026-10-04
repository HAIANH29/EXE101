import { FormEvent, useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { Salon, ServiceItem } from '../../types/salon';
import { salonApi } from '../../services/api';

type ServicesViewProps = {
  salon?: Salon;
};

const emptyForm = {
  name: '',
  description: '',
  price: 150000,
  durationMinutes: 45
};

export function ServicesView({ salon }: ServicesViewProps) {
  const { money, t } = useI18n();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const loadServices = async () => {
    if (!salon) return;
    setServices(await salonApi.getServices(salon.id).catch(() => []));
  };

  useEffect(() => {
    void loadServices();
  }, [salon?.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!salon) return;
    setSaving(true);
    setError(undefined);
    try {
      if (editingId) {
        await salonApi.updateService(editingId, form);
      } else {
        await salonApi.createService(salon.id, form);
      }
      setForm(emptyForm);
      setEditingId(undefined);
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveServiceError'));
    } finally {
      setSaving(false);
    }
  };

  const edit = (service: ServiceItem) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      price: Number(service.price || 0),
      durationMinutes: service.durationMinutes
    });
  };

  if (!salon) return <div className="empty-row">{t('createSalonBeforeServices')}</div>;

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('serviceCatalog')}</span>
          <h2>{t('servicesTitle')}</h2>
          <p>{t('servicesDesc')}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="two-column">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{editingId ? t('updateService') : t('addNewServiceTitle')}</h3>
              <p>{t('serviceFormDesc')}</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={submit}>
            <label>
              {t('serviceName')}
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              {t('description')}
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>
              {t('price')}
              <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} min={0} required />
            </label>
            <label>
              {t('durationMinutes')}
              <input type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} min={1} required />
            </label>
            <div className="form-actions">
              {editingId && <button type="button" className="ghost-button" onClick={() => { setEditingId(undefined); setForm(emptyForm); }}>{t('cancelEdit')}</button>}
              <button className="solid-button" disabled={saving}>{saving ? t('saving') : t('saveService')}</button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{t('servicesList')}</h3>
              <p>{t('activeServicesCount', { count: services.length })}</p>
            </div>
          </div>
          <div className="cards-list">
            {services.length === 0 ? (
              <div className="empty-row">{t('noServices')}</div>
            ) : (
              services.map((service) => (
                <button className="service-card" key={service.id} onClick={() => edit(service)}>
                  <span className="material-symbols-outlined">content_cut</span>
                  <div>
                    <strong>{service.name}</strong>
                    <small>{service.description || t('noDescription')}</small>
                  </div>
                  <b>{money(service.price)}</b>
                  <em>{service.durationMinutes} {t('minutes')}</em>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
