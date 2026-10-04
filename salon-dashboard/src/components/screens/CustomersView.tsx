import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { Appointment, Salon } from '../../types/salon';
import { salonApi } from '../../services/api';

type CustomersViewProps = {
  salon?: Salon;
};

type CustomerSummary = {
  customerId: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  lastVisit?: string;
  nextVisit?: string;
  favoriteService: string;
};

function summarizeCustomers(bookings: Appointment[], noDataLabel: string, serviceLabel: string) {
  const map = new Map<number, CustomerSummary & { services: Map<string, number> }>();
  const now = new Date();

  bookings.forEach((booking) => {
    const current =
      map.get(booking.customerId) ||
      {
        customerId: booking.customerId,
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
        favoriteService: '',
        services: new Map<string, number>()
      };

    current.totalBookings += 1;
    if (booking.status === 'COMPLETED') {
      current.completedBookings += 1;
      current.totalSpent += Number(booking.totalAmount || 0);
    }
    if (booking.status === 'PENDING' || booking.status === 'CONFIRMED') current.pendingBookings += 1;
    if (booking.status === 'CANCELLED') current.cancelledBookings += 1;

    const start = new Date(booking.startAt);
    if (start <= now && (!current.lastVisit || start > new Date(current.lastVisit))) current.lastVisit = booking.startAt;
    if (start > now && (!current.nextVisit || start < new Date(current.nextVisit))) current.nextVisit = booking.startAt;

    const serviceName = booking.serviceName || `${serviceLabel} #${booking.serviceId}`;
    current.services.set(serviceName, (current.services.get(serviceName) || 0) + 1);
    map.set(booking.customerId, current);
  });

  return Array.from(map.values())
    .map(({ services, ...customer }) => ({
      ...customer,
      favoriteService:
        Array.from(services.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || noDataLabel
    }))
    .sort((a, b) => b.totalBookings - a.totalBookings);
}

export function CustomersView({ salon }: CustomersViewProps) {
  const { date, dateTime, money, t } = useI18n();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadCustomers = async () => {
    if (!salon) return;
    setLoading(true);
    setError(undefined);
    try {
      setBookings(await salonApi.getSalonBookings(salon.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('customerLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, [salon?.id]);

  const customers = useMemo(() => summarizeCustomers(bookings, t('noData'), t('service')), [bookings, t]);
  const repeatCustomers = customers.filter((customer) => customer.totalBookings > 1).length;
  const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

  if (!salon) {
    return <div className="empty-row">{t('createSalonBeforeCustomers')}</div>;
  }

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('customerCrm')}</span>
          <h2>{t('customerTitle')}</h2>
          <p>{t('customerDesc')}</p>
        </div>
        <button className="ghost-button" onClick={() => void loadCustomers()}>
          {loading ? t('refreshing') : t('refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="metrics-grid">
        <div className="metric-card">
          <div>
            <span>{t('totalCustomers')}</span>
            <strong>{customers.length}</strong>
            <small>{t('uniqueCustomers')}</small>
          </div>
          <span className="material-symbols-outlined">groups</span>
        </div>
        <div className="metric-card success">
          <div>
            <span>{t('repeatCustomers')}</span>
            <strong>{repeatCustomers}</strong>
            <small>{t('moreThanOneBooking')}</small>
          </div>
          <span className="material-symbols-outlined">loyalty</span>
        </div>
        <div className="metric-card">
          <div>
            <span>{t('customerRevenue')}</span>
            <strong>{money(totalSpent)}</strong>
            <small>{t('completedOnly')}</small>
          </div>
          <span className="material-symbols-outlined">payments</span>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{t('customerDirectory')}</h3>
            <p>{t('customerDirectoryDesc')}</p>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="empty-row">{t('noCustomerBookings')}</div>
        ) : (
          <div className="customer-grid">
            {customers.map((customer) => (
              <article className="customer-card" key={customer.customerId}>
                <div className="customer-avatar">C{customer.customerId}</div>
                <div className="customer-body">
                  <div>
                    <h3>{t('customer')} #{customer.customerId}</h3>
                    <span>{t('customerDetailsPending')}</span>
                  </div>
                  <div className="customer-meta">
                    <span>{customer.totalBookings} {t('appointments')}</span>
                    <span>{customer.completedBookings} {t('completed')}</span>
                    <span>{customer.pendingBookings} {t('active')}</span>
                    <span>{customer.cancelledBookings} {t('cancelled')}</span>
                  </div>
                  <div className="customer-facts">
                    <span>
                      <b>{t('favorite')}:</b> {customer.favoriteService}
                    </span>
                    <span>
                      <b>{t('spent')}:</b> {money(customer.totalSpent)}
                    </span>
                    <span>
                      <b>{t('last')}:</b> {customer.lastVisit ? date(customer.lastVisit) : 'N/A'}
                    </span>
                    <span>
                      <b>{t('next')}:</b> {customer.nextVisit ? dateTime(customer.nextVisit) : 'N/A'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
