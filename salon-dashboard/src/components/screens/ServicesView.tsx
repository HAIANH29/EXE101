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
  durationMinutes: 45,
  imageUrl: '',
  status: 'ACTIVE'
};

export function ServicesView({ salon }: ServicesViewProps) {
  const { money, t } = useI18n();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number>();

  const loadServices = async () => {
    if (!salon) return;
    setServices(await salonApi.getServices(salon.id, 'ALL').catch(() => []));
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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        imageUrl: form.imageUrl.trim() || undefined,
        status: form.status
      };

      if (editingId) {
        await salonApi.updateService(editingId, payload);
      } else {
        await salonApi.createService(salon.id, payload);
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
      durationMinutes: service.durationMinutes,
      imageUrl: service.imageUrl || '',
      status: service.status || 'ACTIVE'
    });
  };

  const handleToggleStatus = async (service: ServiceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!salon) return;
    setTogglingId(service.id);
    setError(undefined);
    try {
      const nextStatus = service.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await salonApi.updateService(service.id, {
        name: service.name,
        description: service.description || '',
        price: Number(service.price || 0),
        durationMinutes: service.durationMinutes,
        imageUrl: service.imageUrl,
        status: nextStatus
      });
      await loadServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setTogglingId(undefined);
    }
  };

  if (!salon) return <div className="empty-row">{t('createSalonBeforeServices')}</div>;

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('serviceCatalog')}</span>
          <h2>{t('servicesTitle')}</h2>
          <p>{t('servicesDesc')} · {salon.name}</p>
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
              {t('price')} (VNĐ)
              <input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} min={0} required />
            </label>
            <label>
              {t('durationMinutes')}
              <input type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} min={1} required />
            </label>
            <label>
              URL hình ảnh dịch vụ (tùy chọn)
              <input
                type="url"
                value={form.imageUrl}
                onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </label>
            <label>
              Trạng thái hoạt động
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--ink)'
                }}
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="INACTIVE">Tạm dừng cung cấp</option>
              </select>
            </label>

            <div className="form-actions">
              {editingId && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setEditingId(undefined);
                    setForm(emptyForm);
                  }}
                >
                  {t('cancelEdit')}
                </button>
              )}
              <button className="solid-button" disabled={saving}>
                {saving ? t('saving') : t('saveService')}
              </button>
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
              services.map((service) => {
                const isActive = (service.status || 'ACTIVE') === 'ACTIVE';
                const isToggling = togglingId === service.id;
                return (
                  <div
                    className="service-card"
                    key={service.id}
                    onClick={() => edit(service)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      opacity: isActive ? 1 : 0.65
                    }}
                  >
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          border: '1px solid var(--line)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          background: 'var(--surface-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <span className="material-symbols-outlined">content_cut</span>
                      </div>
                    )}

                    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {service.name}
                        </strong>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 999,
                            background: isActive ? 'rgba(46, 125, 50, 0.12)' : 'rgba(120, 120, 120, 0.15)',
                            color: isActive ? '#2e7d32' : 'var(--muted)'
                          }}
                        >
                          {isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                      <small style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {service.description || t('noDescription')}
                      </small>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <b>{money(service.price)}</b>
                      <em style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        {service.durationMinutes} {t('minutes')}
                      </em>
                    </div>

                    <button
                      type="button"
                      className="ghost-button mini"
                      disabled={isToggling}
                      onClick={(e) => handleToggleStatus(service, e)}
                      title={isActive ? 'Tạm dừng dịch vụ' : 'Kích hoạt dịch vụ'}
                      style={{ flexShrink: 0, padding: '4px 8px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {isActive ? 'pause_circle' : 'play_circle'}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
