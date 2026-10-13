import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../i18n';
import { usePayT } from '../../payI18n';
import { salonApi } from '../../services/api';
import { PaymentInfo, Salon } from '../../types/salon';
import { PaymentPanel } from '../payments/PaymentPanel';

type SubscriptionViewProps = {
  salon?: Salon;
};

const PRO_TYPE = 'SALON_PRO_SUBSCRIPTION';

export function SubscriptionView({ salon }: SubscriptionViewProps) {
  const { t, money, dateTime } = useI18n();
  const pt = usePayT();
  const [history, setHistory] = useState<PaymentInfo[]>([]);
  const [activePayment, setActivePayment] = useState<PaymentInfo>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string>();

  const loadHistory = async () => {
    try {
      setHistory(await salonApi.getPaymentHistory());
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  // Giao dịch Pro của chi nhánh đang chọn
  const salonProPayments = useMemo(
    () => history.filter((payment) => payment.paymentType === PRO_TYPE && payment.salonId === salon?.id),
    [history, salon?.id]
  );
  const paidPro = salonProPayments.find((payment) => payment.status === 'PAID');
  const pendingPro = salonProPayments.find((payment) => payment.status === 'PENDING');

  const upgrade = async () => {
    if (!salon) return;
    setCreating(true);
    setError(undefined);
    try {
      const payment = await salonApi.subscribePro(salon.id);
      setActivePayment(payment);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : pt('subCreateError'));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = (payment: PaymentInfo) => {
    setActivePayment(payment);
    setHistory((current) => current.map((item) => (item.id === payment.id ? payment : item)));
  };

  const proButton = () => {
    if (!salon) return <button disabled title={pt('subNeedSalon')}>{pt('subNeedSalon')}</button>;
    if (paidPro) return <button disabled>{pt('subProActive')}</button>;
    if (pendingPro) {
      return <button onClick={() => setActivePayment(pendingPro)}>{pt('subPayPending')}</button>;
    }
    return (
      <button disabled={creating} onClick={() => void upgrade()}>
        {creating ? pt('subUpgrading') : pt('subUpgrade')}
      </button>
    );
  };

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('subscription')}</span>
          <h2>{t('subscriptionTitle')}</h2>
          <p>{salon ? pt('subCurrentPlanFor', { name: salon.name }) : t('subscriptionDesc')}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {!activePayment && pendingPro && <div className="error-banner">{pt('subOpenPending')}</div>}

      {activePayment && (
        <section className="panel">
          <PaymentPanel
            payment={activePayment}
            refresh={() => salonApi.getPayment(activePayment.id)}
            onUpdate={handleUpdate}
            onClose={() => setActivePayment(undefined)}
          />
        </section>
      )}

      <div className="pricing-grid">
        <section className="plan-card">
          <div>
            <span className={`plan-badge ${paidPro ? '' : 'muted'}`}>{paidPro ? '' : t('current')}</span>
            <h3>{t('free')}</h3>
            <p>{t('freeDesc')}</p>
            <strong>0 VNĐ <small>{t('monthly')}</small></strong>
            <ul>
              <li><span className="material-symbols-outlined">check_circle</span>{t('basicAppointmentManagement')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('upTo50Customers')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('upTo2Stylists')}</li>
            </ul>
          </div>
          <button disabled>{paidPro ? '—' : t('inUse')}</button>
        </section>

        <section className="plan-card pro">
          <div>
            <span className="plan-badge">{paidPro ? pt('subProActive') : t('recommended')}</span>
            <h3>Pro</h3>
            <p>{t('proDesc')}</p>
            <strong>150.000 VNĐ <small>{t('monthly')}</small></strong>
            {paidPro?.paidAt && <p>{pt('subProPaidAt', { time: dateTime(paidPro.paidAt) })}</p>}
            <ul>
              <li><span className="material-symbols-outlined">star</span>{t('prioritySearch')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('unlockShiftManagement')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('detailedRevenueReports')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('unlimitedCustomersStylists')}</li>
            </ul>
          </div>
          {proButton()}
        </section>

        <section className="support-card">
          <span className="material-symbols-outlined">support_agent</span>
          <h3>{t('needConsulting')}</h3>
          <p>{t('consultingDesc')}</p>
          <button disabled>{t('contactComing')}</button>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{pt('subHistoryTitle')}</h3>
            <p>{pt('subHistoryDesc')}</p>
          </div>
        </div>
        {history.length === 0 ? (
          <div className="empty-row">{pt('subHistoryEmpty')}</div>
        ) : (
          <div className="appointments-table">
            <div className="table-head" style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1.3fr 1fr' }}>
              <span>{pt('subColType')}</span>
              <span>{pt('subColRef')}</span>
              <span>{pt('subColAmount')}</span>
              <span>{pt('subColStatus')}</span>
              <span>{pt('subColDate')}</span>
              <span />
            </div>
            {history.map((payment) => (
              <div className="table-row" key={payment.id} style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1.3fr 1fr' }}>
                <span>{pt(`payType${payment.paymentType}`)}</span>
                <span>{payment.referenceCode}</span>
                <span>{money(payment.amount)}</span>
                <span>
                  <span className={`status-pill ${payment.status === 'PAID' ? 'ok' : payment.status === 'PENDING' ? 'warn' : payment.status === 'REFUNDED' ? 'ok' : 'muted'}`}>
                    {pt(`payStatus${payment.status}`)}
                  </span>
                </span>
                <span>{dateTime(payment.paidAt || payment.createdAt || '')}</span>
                <span className="row-actions">
                  {payment.status === 'PENDING' && (
                    <button className="mini success" onClick={() => setActivePayment(payment)}>
                      {pt('subPayPending')}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>{t('featureComparison')}</h3>
            <p>{t('pricingPolicyDesc')}</p>
          </div>
        </div>
        <div className="comparison-table">
          {[
            [t('onlineBooking'), t('yes'), t('yes')],
            [t('customerStorageLimit'), '50', t('unlimited')],
            [t('stylistManagement'), t('twoStylists'), t('unlimited')],
            [t('advancedShiftManagement'), '-', t('yes')],
            [t('realtimeRevenueReports'), '-', t('yes')],
            [t('priorityRecommendation'), '-', t('yes')]
          ].map(([feature, free, pro]) => (
            <div className="comparison-row" key={feature}>
              <span>{feature}</span>
              <b>{free}</b>
              <strong>{pro}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
