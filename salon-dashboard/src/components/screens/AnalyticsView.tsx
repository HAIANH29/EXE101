import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { Appointment, BackendBookingStatus, Salon, ServiceItem, Stylist } from '../../types/salon';
import { salonApi } from '../../services/api';

type AnalyticsViewProps = {
  salon?: Salon;
};

type ServiceStat = {
  label: string;
  count: number;
  revenue: number;
};

const statuses: BackendBookingStatus[] = ['PENDING', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED'];

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
}

export function AnalyticsView({ salon }: AnalyticsViewProps) {
  const { money, statusLabel, t } = useI18n();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadAnalytics = async () => {
    if (!salon) return;
    setLoading(true);
    setError(undefined);
    try {
      const [nextBookings, nextServices, nextStylists] = await Promise.all([
        salonApi.getSalonBookings(salon.id),
        salonApi.getServices(salon.id),
        salonApi.getStylists(salon.id)
      ]);
      setBookings(nextBookings);
      setServices(nextServices);
      setStylists(nextStylists);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('analyticsLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [salon?.id]);

  const statusCounts = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        count: bookings.filter((booking) => booking.status === status).length
      })),
    [bookings]
  );

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    bookings
      .filter((booking) => booking.status === 'COMPLETED')
      .forEach((booking) => {
        const key = monthKey(booking.startAt);
        map.set(key, (map.get(key) || 0) + Number(booking.totalAmount || 0));
      });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([label, value]) => ({ label, value }));
  }, [bookings]);

  const serviceStats = useMemo(() => {
    const map = new Map<string, ServiceStat>();
    bookings.forEach((booking) => {
      const label = booking.serviceName || `${t('service')} #${booking.serviceId}`;
      const current = map.get(label) || { label, count: 0, revenue: 0 };
      current.count += 1;
      if (booking.status === 'COMPLETED') current.revenue += Number(booking.totalAmount || 0);
      map.set(label, current);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [bookings, t]);

  const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.value, 0);
  const maxMonthRevenue = Math.max(...revenueByMonth.map((item) => item.value), 0);
  const maxServiceCount = Math.max(...serviceStats.map((item) => item.count), 0);

  if (!salon) {
    return <div className="empty-row">{t('createSalonBeforeAnalytics')}</div>;
  }

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('analytics')}</span>
          <h2>{t('analyticsTitle')}</h2>
          <p>{t('analyticsDesc')}</p>
        </div>
        <button className="ghost-button" onClick={() => void loadAnalytics()}>
          {loading ? t('refreshing') : t('refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="metrics-grid">
        <div className="metric-card success">
          <div>
            <span>{t('revenueLoaded')}</span>
            <strong>{money(totalRevenue)}</strong>
            <small>{t('lastSixMonths')}</small>
          </div>
          <span className="material-symbols-outlined">monitoring</span>
        </div>
        <div className="metric-card">
          <div>
            <span>{t('totalBookings')}</span>
            <strong>{bookings.length}</strong>
            <small>{t('currentPage')}</small>
          </div>
          <span className="material-symbols-outlined">event_available</span>
        </div>
        <div className="metric-card">
          <div>
            <span>{t('catalogSize')}</span>
            <strong>{services.length}</strong>
            <small>{t('activeServiceCatalog')}</small>
          </div>
          <span className="material-symbols-outlined">inventory_2</span>
        </div>
        <div className="metric-card">
          <div>
            <span>{t('teamSize')}</span>
            <strong>{stylists.length}</strong>
            <small>{t('activeTeamMembers')}</small>
          </div>
          <span className="material-symbols-outlined">groups_2</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-head">
            <div>
              <h3>{t('revenueByMonth')}</h3>
              <p>{t('completedOnly')}</p>
            </div>
          </div>
          {revenueByMonth.length === 0 ? (
            <div className="empty-row">{t('noCompletedRevenueChart')}</div>
          ) : (
            <div className="bar-chart analytics-bars">
              {revenueByMonth.map((month) => (
                <div className="bar-item" key={month.label}>
                  <div style={{ height: `${toPercent(month.value, maxMonthRevenue)}%` }} />
                  <span>{month.label}</span>
                  <small>{money(month.value)}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{t('bookingStatus')}</h3>
              <p>{t('bookingStatusDesc')}</p>
            </div>
          </div>
          <div className="stat-list">
            {statusCounts.map((item) => (
              <div className="stat-line" key={item.status}>
                <span>{statusLabel(item.status)}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{t('topServices')}</h3>
            <p>{t('topServicesDesc')}</p>
          </div>
        </div>
        {serviceStats.length === 0 ? (
          <div className="empty-row">{t('noServiceBookingData')}</div>
        ) : (
          <div className="horizontal-bars">
            {serviceStats.map((service) => (
              <div className="horizontal-bar" key={service.label}>
                <div>
                  <strong>{service.label}</strong>
                  <span>{service.count} {t('appointments')} · {money(service.revenue)}</span>
                </div>
                <div className="track">
                  <span style={{ width: `${toPercent(service.count, maxServiceCount)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
