import { useI18n } from '../../i18n';

export function SubscriptionView() {
  const { t } = useI18n();

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{t('subscription')}</span>
          <h2>{t('subscriptionTitle')}</h2>
          <p>{t('subscriptionDesc')}</p>
        </div>
      </div>

      <div className="pricing-grid">
        <section className="plan-card">
          <div>
            <span className="plan-badge muted">{t('current')}</span>
            <h3>{t('free')}</h3>
            <p>{t('freeDesc')}</p>
            <strong>0 VNĐ <small>{t('monthly')}</small></strong>
            <ul>
              <li><span className="material-symbols-outlined">check_circle</span>{t('basicAppointmentManagement')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('upTo50Customers')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('upTo2Stylists')}</li>
            </ul>
          </div>
          <button disabled>{t('inUse')}</button>
        </section>

        <section className="plan-card pro">
          <div>
            <span className="plan-badge">{t('recommended')}</span>
            <h3>Pro</h3>
            <p>{t('proDesc')}</p>
            <strong>150.000 VNĐ <small>{t('monthly')}</small></strong>
            <ul>
              <li><span className="material-symbols-outlined">star</span>{t('prioritySearch')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('unlockShiftManagement')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('detailedRevenueReports')}</li>
              <li><span className="material-symbols-outlined">check_circle</span>{t('unlimitedCustomersStylists')}</li>
            </ul>
          </div>
          <button disabled title={t('paymentComingTitle')}>
            {t('paymentComing')}
          </button>
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
