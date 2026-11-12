import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { Appointment, Salon, SalonDashboardStats, ServiceItem } from '../../types/salon';
import { salonApi } from '../../services/api';

type DashboardOverviewProps = {
  salon?: Salon;
  onNavigate: (tab: 'Appointments' | 'Services' | 'Staff' | 'Settings') => void;
};

function toPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
}

function MetricCard({
  title,
  value,
  trend,
  icon,
  tone = 'neutral'
}: {
  title: string;
  value: string;
  trend: string;
  icon: string;
  tone?: 'neutral' | 'warning' | 'success';
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{trend}</small>
      </div>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  );
}

export function DashboardOverview({ salon, onNavigate }: DashboardOverviewProps) {
  const { dateTime, money, statusLabel, t } = useI18n();
  const [stats, setStats] = useState<SalonDashboardStats>();
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!salon) return;
    let active = true;
    setLoading(true);
    setError(undefined);
    // Số liệu lấy thẳng từ DB qua backend (không tự cộng dồn từ một trang booking ở client)
    Promise.all([
      salonApi.getDashboardStats(salon.id),
      salonApi.getUpcomingBookings(salon.id, 10),
      salonApi.getServices(salon.id).catch(() => [])
    ])
      .then(([nextStats, nextUpcoming, nextServices]) => {
        if (!active) return;
        setStats(nextStats);
        setUpcoming(
          nextUpcoming.filter((booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED').slice(0, 5)
        );
        setServices(nextServices);
      })
      .catch((err) => {
        if (!active) return;
        setStats(undefined);
        setError(err instanceof Error ? err.message : t('analyticsLoadError'));
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [salon?.id]);

  const activeServices = useMemo(
    () => services.filter((service) => service.status !== 'INACTIVE').length,
    [services]
  );
  const revenueByMonth = useMemo(
    () => (stats?.revenueByMonth || []).map((item) => ({ label: item.month, value: Number(item.revenue || 0) })),
    [stats]
  );
  const maxMonthRevenue = Math.max(...revenueByMonth.map((item) => item.value), 0);
  const hasRevenue = maxMonthRevenue > 0;

  if (!salon) {
    return (
      <div className="empty-workspace">
        <span className="material-symbols-outlined">storefront</span>
        <h2>{t('noSalonWorkspaceTitle')}</h2>
        <p>{t('noSalonWorkspaceDesc')}</p>
        <button onClick={() => onNavigate('Settings')}>{t('createBranch')}</button>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('liveOverview')}</span>
          <h2>{t('dashboardOverviewTitle')}</h2>
          <p>{t('salonStatusSentence', { name: salon.name, status: salon.status || t('updating') })}</p>
        </div>
        <div className="header-actions">
          <button className="ghost-button" onClick={() => onNavigate('Services')}>{t('addService')}</button>
          <button className="solid-button" onClick={() => onNavigate('Appointments')}>{t('reviewBookings')}</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="metrics-grid">
        <MetricCard title={t('todayAppointments')} value={String(stats?.bookingsToday ?? 0)} trend={loading ? t('loading') : t('updatedFromBookings')} icon="calendar_today" />
        <MetricCard title={t('pending')} value={String(stats?.pendingBookings ?? 0)} trend={t('requiresAction')} icon="pending_actions" tone="warning" />
        <MetricCard title={t('completed')} value={String(stats?.completedBookings ?? 0)} trend={t('allTimeLoadedPage')} icon="task_alt" tone="success" />
        <MetricCard title={t('monthRevenue')} value={money(Number(stats?.revenueThisMonth ?? 0))} trend={t('completedOnly')} icon="payments" tone="success" />
        <MetricCard title={t('services')} value={String(activeServices)} trend={t('activeCatalogItems')} icon="content_cut" />
        <MetricCard title={t('stylists')} value={String(stats?.activeStylists ?? 0)} trend={t('teamMembers')} icon="badge" />
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-head">
            <div>
              <h3>{t('revenueTrend')}</h3>
              <p>{t('branchCompletedRevenue')}</p>
            </div>
          </div>
          {!hasRevenue ? (
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
              <h3>{t('quickActions')}</h3>
              <p>{t('commonOwnerActions')}</p>
            </div>
          </div>
          <div className="quick-list">
            <button onClick={() => onNavigate('Appointments')}><span className="material-symbols-outlined">done_all</span>{t('confirmBookings')}</button>
            <button onClick={() => onNavigate('Services')}><span className="material-symbols-outlined">add_business</span>{t('addNewService')}</button>
            <button onClick={() => onNavigate('Staff')}><span className="material-symbols-outlined">person_add</span>{t('addStylist')}</button>
            <button onClick={() => onNavigate('Settings')}><span className="material-symbols-outlined">schedule</span>{t('updateBusinessHours')}</button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{t('upcomingAppointments')}</h3>
            <p>{t('upcomingDesc')}</p>
          </div>
          <button className="ghost-button" onClick={() => onNavigate('Appointments')}>{t('viewAll')}</button>
        </div>
        {upcoming.length === 0 ? (
          <div className="empty-row">{t('noUpcomingAppointments')}</div>
        ) : (
          <div className="compact-table">
            {upcoming.map((booking) => (
              <div className="compact-row" key={booking.id}>
                <span className="status-pill pending">{statusLabel(booking.status)}</span>
                <strong>{t('customer')} #{booking.customerId}</strong>
                <span>{booking.serviceName || `${t('service')} #${booking.serviceId}`}</span>
                <span>{dateTime(booking.startAt)}</span>
                <b>{money(Number(booking.totalAmount || 0))}</b>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
