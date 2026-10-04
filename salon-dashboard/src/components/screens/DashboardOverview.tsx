import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { Appointment, DashboardSnapshot, Salon, ServiceItem, Stylist } from '../../types/salon';
import { salonApi } from '../../services/api';

type DashboardOverviewProps = {
  salon?: Salon;
  onNavigate: (tab: 'Appointments' | 'Services' | 'Staff' | 'Settings') => void;
};

function sameDay(value: string, reference = new Date()) {
  const date = new Date(value);
  return date.toDateString() === reference.toDateString();
}

function sameMonth(value: string, reference = new Date()) {
  const date = new Date(value);
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
}

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toPercent(value: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(8, Math.round((value / max) * 100));
}

function buildSnapshot(bookings: Appointment[], services: ServiceItem[], stylists: Stylist[]): DashboardSnapshot {
  return {
    todayAppointments: bookings.filter((booking) => sameDay(booking.startAt)).length,
    pendingAppointments: bookings.filter((booking) => booking.status === 'PENDING').length,
    completedAppointments: bookings.filter((booking) => booking.status === 'COMPLETED').length,
    monthRevenue: bookings
      .filter((booking) => booking.status === 'COMPLETED' && sameMonth(booking.startAt))
      .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0),
    activeServices: services.filter((service) => service.status !== 'INACTIVE').length,
    activeStylists: stylists.filter((stylist) => stylist.status !== 'INACTIVE').length
  };
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
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!salon) return;
    let active = true;
    setLoading(true);
    Promise.all([
      salonApi.getSalonBookings(salon.id).catch(() => []),
      salonApi.getServices(salon.id).catch(() => []),
      salonApi.getStylists(salon.id).catch(() => [])
    ])
      .then(([nextBookings, nextServices, nextStylists]) => {
        if (!active) return;
        setBookings(nextBookings);
        setServices(nextServices);
        setStylists(nextStylists);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [salon]);

  const snapshot = useMemo(() => buildSnapshot(bookings, services, stylists), [bookings, services, stylists]);
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
  const maxMonthRevenue = Math.max(...revenueByMonth.map((item) => item.value), 0);
  const upcoming = bookings
    .filter((booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED')
    .slice(0, 5);

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

      <div className="metrics-grid">
        <MetricCard title={t('todayAppointments')} value={String(snapshot.todayAppointments)} trend={loading ? t('loading') : t('updatedFromBookings')} icon="calendar_today" />
        <MetricCard title={t('pending')} value={String(snapshot.pendingAppointments)} trend={t('requiresAction')} icon="pending_actions" tone="warning" />
        <MetricCard title={t('completed')} value={String(snapshot.completedAppointments)} trend={t('allTimeLoadedPage')} icon="task_alt" tone="success" />
        <MetricCard title={t('monthRevenue')} value={money(snapshot.monthRevenue)} trend={t('completedOnly')} icon="payments" tone="success" />
        <MetricCard title={t('services')} value={String(snapshot.activeServices)} trend={t('activeCatalogItems')} icon="content_cut" />
        <MetricCard title={t('stylists')} value={String(snapshot.activeStylists)} trend={t('teamMembers')} icon="badge" />
      </div>

      <div className="dashboard-grid">
        <section className="panel wide">
          <div className="panel-head">
            <div>
              <h3>{t('revenueTrend')}</h3>
              <p>{t('branchCompletedRevenue')}</p>
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
