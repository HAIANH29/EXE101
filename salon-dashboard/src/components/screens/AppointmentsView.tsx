import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { Appointment, BackendBookingStatus, Salon } from '../../types/salon';
import { salonApi } from '../../services/api';

type AppointmentsViewProps = {
  salon?: Salon;
};

const statusTabs: Array<{ label: string; value: BackendBookingStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

export function AppointmentsView({ salon }: AppointmentsViewProps) {
  const { dateTime, money, statusLabel, t } = useI18n();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<BackendBookingStatus | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadBookings = async () => {
    if (!salon) return;
    setLoading(true);
    setError(undefined);
    try {
      setBookings(await salonApi.getSalonBookings(salon.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadBookingsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [salon?.id]);

  const filtered = useMemo(
    () => (filter === 'ALL' ? bookings : bookings.filter((booking) => booking.status === filter)),
    [bookings, filter]
  );

  const updateBooking = async (booking: Appointment, action: 'confirm' | 'complete' | 'cancel') => {
    try {
      const next =
        action === 'confirm'
          ? await salonApi.confirmBooking(booking.id)
          : action === 'complete'
          ? await salonApi.completeBooking(booking.id)
          : await salonApi.cancelBooking(booking.id);
      setBookings((current) => current.map((item) => (item.id === next.id ? next : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('updateBookingError'));
    }
  };

  if (!salon) {
    return <div className="empty-row">{t('createSalonBeforeAppointments')}</div>;
  }

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('appointments')}</span>
          <h2>{t('appointmentsTitle')}</h2>
          <p>{t('appointmentsDesc', { name: salon.name })}</p>
        </div>
        <button className="ghost-button" onClick={() => void loadBookings()}>
          {loading ? t('refreshing') : t('refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="status-tabs">
        {statusTabs.map((tab) => (
          <button key={tab.value} className={filter === tab.value ? 'active' : ''} onClick={() => setFilter(tab.value)}>
            {tab.value === 'ALL' ? t('all') : statusLabel(tab.value)}
            <span>{tab.value === 'ALL' ? bookings.length : bookings.filter((booking) => booking.status === tab.value).length}</span>
          </button>
        ))}
      </div>

      <section className="panel">
        {filtered.length === 0 ? (
          <div className="empty-row">{t('noAppointmentsInTab')}</div>
        ) : (
          <div className="appointments-table">
            <div className="table-head">
              <span>{t('booking')}</span>
              <span>{t('customer')}</span>
              <span>{t('service')}</span>
              <span>{t('stylist')}</span>
              <span>{t('time')}</span>
              <span>{t('total')}</span>
              <span>{t('actions')}</span>
            </div>
            {filtered.map((booking) => (
              <div className="table-row" key={booking.id}>
                <span>
                  <b>#{booking.id}</b>
                  <small>{statusLabel(booking.status)}</small>
                </span>
                <span>
                  <b>{t('customer')} #{booking.customerId}</b>
                  <small>{t('contactNotUpdated')}</small>
                </span>
                <span>{booking.serviceName || `${t('service')} #${booking.serviceId}`}</span>
                <span>{booking.stylistName || `${t('stylist')} #${booking.stylistId}`}</span>
                <span>{dateTime(booking.startAt)}</span>
                <span>{money(booking.totalAmount)}</span>
                <span className="row-actions">
                  {booking.status === 'PENDING' && (
                    <button className="mini success" onClick={() => void updateBooking(booking, 'confirm')}>{t('confirm')}</button>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <button className="mini success" onClick={() => void updateBooking(booking, 'complete')}>{t('complete')}</button>
                  )}
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button className="mini danger" onClick={() => void updateBooking(booking, 'cancel')}>{t('cancel')}</button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
