import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminBookingStats, AdminOverview as Overview, AdminTab } from '../../types/admin';

type AdminOverviewProps = {
  onNavigate: (tab: AdminTab) => void;
};

type MetricProps = {
  title: string;
  value: string | number;
  note: string;
  icon: string;
  tone?: 'warning' | 'success' | '';
  onClick?: () => void;
};

function Metric({ title, value, note, icon, tone = '', onClick }: MetricProps) {
  return (
    <div
      className={`metric-card ${tone} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  );
}

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const { money } = useI18n();
  const at = useAdminT();
  const [overview, setOverview] = useState<Overview>();
  const [stats, setStats] = useState<AdminBookingStats>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [overviewResult, statsResult] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getBookingStats().catch(() => undefined)
      ]);
      setOverview(overviewResult);
      setStats(statsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const breakdown = stats
    ? [
        { key: 'bkPending', value: stats.pending },
        { key: 'bkConfirmed', value: stats.confirmed },
        { key: 'bkCompleted', value: stats.completed },
        { key: 'bkCancelled', value: stats.cancelled }
      ]
    : [];
  const maxValue = Math.max(1, ...breakdown.map((item) => item.value));

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{at('tabOverview')}</span>
          <h2>{at('ovTitle')}</h2>
          <p>{at('ovDesc')}</p>
        </div>
        <button className="ghost-button" onClick={() => void load()}>
          {loading ? at('loading') : at('refresh')}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error} <button className="mini" onClick={() => void load()}>{at('retry')}</button>
        </div>
      )}

      {overview && (
        <>
          {overview.pendingApprovalSalons > 0 && (
            <div className="admin-callout admin-callout-pending">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="material-symbols-outlined callout-icon" style={{ fontSize: 32, color: 'var(--brand)' }}>
                  pending_actions
                </span>
                <div>
                  <strong style={{ fontSize: 16 }}>{at('slPendingAlertTitle', { count: overview.pendingApprovalSalons })}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                    {at('slPendingAlertDesc')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="solid-button"
                onClick={() => onNavigate('Salons')}
              >
                {at('slPendingReviewNow')}
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </button>
            </div>
          )}

          <div className="metrics-grid admin-metrics">
            <Metric
              title={at('ovUsers')}
              value={overview.totalUsers.toLocaleString()}
              note={at('ovNewUsers', { count: overview.newUsersThisMonth })}
              icon="group"
            />
            <Metric
              title={at('ovSalons')}
              value={overview.activeSalons}
              note={
                overview.pendingApprovalSalons > 0
                  ? `${at('ovSalonsOf', { count: overview.totalSalons })} · ${overview.pendingApprovalSalons} ${at('st_PENDING_APPROVAL').toLowerCase()}`
                  : at('ovSalonsOf', { count: overview.totalSalons })
              }
              icon="storefront"
              tone={overview.pendingApprovalSalons > 0 ? 'warning' : 'success'}
              onClick={() => onNavigate('Salons')}
            />
            {overview.pendingApprovalSalons > 0 && (
              <Metric
                title={at('slPendingSalons')}
                value={overview.pendingApprovalSalons}
                note={at('hintSalons')}
                icon="pending_actions"
                tone="warning"
                onClick={() => onNavigate('Salons')}
              />
            )}
            <Metric
              title={at('ovBookingsMonth')}
              value={overview.totalBookingsThisMonth}
              note={`${at('ovPendingBookings')}: ${overview.pendingBookings}`}
              icon="calendar_month"
            />
            <Metric
              title={at('ovRevenue')}
              value={money(overview.revenueThisMonth)}
              note={`${at('bkCompleted')}: ${overview.completedBookings}`}
              icon="payments"
              tone="success"
            />
          </div>
        </>
      )}

      {stats && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>{at('ovBookingBreakdown')}</h3>
              <p>{at('ovBookingBreakdownDesc')} · {stats.total}</p>
            </div>
          </div>
          <div className="admin-bars">
            {breakdown.map((item) => (
              <div className="admin-bar-row" key={item.key}>
                <span>{at(item.key)}</span>
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ width: `${(item.value / maxValue) * 100}%` }} />
                </div>
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
