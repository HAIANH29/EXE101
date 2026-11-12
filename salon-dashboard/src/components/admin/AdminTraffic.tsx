import { useEffect, useState } from 'react';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminTrafficReport, TrafficSourceRow } from '../../types/admin';

const RANGES = [7, 30, 90];

function TrafficTable({ rows, showCampaign }: { rows: TrafficSourceRow[]; showCampaign: boolean }) {
  const at = useAdminT();
  const max = Math.max(1, ...rows.map((row) => row.visits));

  return (
    <div className="utm-table">
      <div className="utm-row utm-head">
        <span>{at('trSource')}</span>
        <span>{at(showCampaign ? 'trCampaign' : 'trMedium')}</span>
        <span>{at('trVisits')}</span>
        <span>{at('trSessions')}</span>
      </div>
      {rows.map((row) => (
        <div className="utm-row" key={`${row.source}|${row.medium}|${row.campaign}`}>
          <span>
            <b>{row.source}</b>
            {showCampaign && <small>{row.medium}</small>}
          </span>
          <span>{showCampaign ? row.campaign : row.medium}</span>
          <span className="utm-visits">
            <i style={{ width: `${(row.visits / max) * 100}%` }} />
            <b>{row.visits.toLocaleString()}</b>
          </span>
          <span>{row.sessions.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminTraffic() {
  const at = useAdminT();
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<AdminTrafficReport>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    adminApi
      .getTrafficReport(days)
      .then((result) => active && setReport(result))
      .catch((err) => active && setError(err instanceof Error ? err.message : at('genericError')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [days]);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>{at('trTitle')}</h3>
          <p>{at('trDesc')}</p>
        </div>
        <div className="utm-ranges">
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              className={value === days ? 'solid-button' : 'ghost-button'}
              onClick={() => setDays(value)}
            >
              {at('trDays', { days: value })}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && !report && <div className="empty-row">{at('loading')}</div>}

      {report && (
        <>
          <div className="utm-totals">
            <div>
              <span>{at('trVisits')}</span>
              <strong>{report.totalVisits.toLocaleString()}</strong>
            </div>
            <div>
              <span>{at('trSessions')}</span>
              <strong>{report.uniqueSessions.toLocaleString()}</strong>
            </div>
          </div>

          {report.bySource.length === 0 ? (
            <div className="empty-row">{at('trEmpty')}</div>
          ) : (
            <>
              <h4 className="utm-subtitle">{at('trBySource')}</h4>
              <TrafficTable rows={report.bySource} showCampaign={false} />
              {report.byCampaign.length > 0 && (
                <>
                  <h4 className="utm-subtitle">{at('trByCampaign')}</h4>
                  <TrafficTable rows={report.byCampaign} showCampaign />
                </>
              )}
            </>
          )}
        </>
      )}

      <p className="utm-hint">{at('trHint')}</p>
    </section>
  );
}
