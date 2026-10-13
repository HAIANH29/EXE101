import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminSalonStatus } from '../../types/admin';
import { Salon } from '../../types/salon';
import { Pager, StatusPill } from './AdminParts';

const FILTERS: (AdminSalonStatus | '')[] = ['PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', ''];
const COLUMNS = '1.6fr 1.2fr 0.8fr 1fr 1fr 1.3fr';

export function AdminSalons() {
  const { date } = useI18n();
  const at = useAdminT();
  const [filter, setFilter] = useState<AdminSalonStatus | ''>('PENDING_APPROVAL');
  const [pageNo, setPageNo] = useState(0);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busyId, setBusyId] = useState<number>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await adminApi.getSalons(filter, pageNo);
      setSalons(result.content || []);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter, pageNo]);

  const changeFilter = (next: AdminSalonStatus | '') => {
    setPageNo(0);
    setFilter(next);
  };

  const decide = async (salon: Salon, action: 'approve' | 'reject') => {
    if (action === 'reject' && !window.confirm(at('slRejectConfirm', { name: salon.name }))) return;
    setBusyId(salon.id);
    setError(undefined);
    setNotice(undefined);
    try {
      if (action === 'approve') await adminApi.approveSalon(salon.id);
      else await adminApi.rejectSalon(salon.id);
      setNotice(at(action === 'approve' ? 'slApproved' : 'slRejected', { name: salon.name }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <div className="screen-stack">
      <div className="screen-header">
        <div>
          <span className="eyebrow">{at('tabSalons')}</span>
          <h2>{at('slTitle')}</h2>
          <p>{at('slDesc')}</p>
        </div>
        <button className="ghost-button" onClick={() => void load()}>
          {loading ? at('loading') : at('refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      <div className="status-tabs">
        {FILTERS.map((item) => (
          <button key={item || 'ALL'} className={filter === item ? 'active' : ''} onClick={() => changeFilter(item)}>
            {item ? at(`st_${item}`) : at('all')}
          </button>
        ))}
      </div>

      <section className="panel">
        {!loading && salons.length === 0 ? (
          <div className="empty-row">{at('slEmpty')}</div>
        ) : (
          <div className="appointments-table">
            <div className="table-head" style={{ gridTemplateColumns: COLUMNS }}>
              <span>{at('slName')}</span>
              <span>{at('slOwner')}</span>
              <span>{at('status')}</span>
              <span>{at('created')}</span>
              <span>#</span>
              <span>{at('actions')}</span>
            </div>
            {salons.map((salon) => (
              <div className="table-row" key={salon.id} style={{ gridTemplateColumns: COLUMNS }}>
                <span>
                  <b>{salon.name}</b>
                  <small>{salon.address || '—'}</small>
                </span>
                <span>
                  <b>#{salon.ownerId}</b>
                  <small>{salon.phone || '—'}</small>
                </span>
                <span>
                  <StatusPill status={salon.status} label={salon.status ? at(`st_${salon.status}`) : '—'} />
                </span>
                <span>{salon.createdAt ? date(salon.createdAt) : '—'}</span>
                <span>{salon.id}</span>
                <span className="row-actions">
                  {salon.status !== 'ACTIVE' && (
                    <button className="mini success" disabled={busyId === salon.id} onClick={() => void decide(salon, 'approve')}>
                      {at('slApprove')}
                    </button>
                  )}
                  {salon.status === 'PENDING_APPROVAL' && (
                    <button className="mini danger" disabled={busyId === salon.id} onClick={() => void decide(salon, 'reject')}>
                      {at('slReject')}
                    </button>
                  )}
                  {salon.status === 'ACTIVE' && (
                    <button className="mini danger" disabled={busyId === salon.id} onClick={() => void decide(salon, 'reject')}>
                      {at('slDeactivate')}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        <Pager page={pageNo} totalPages={totalPages} onChange={setPageNo} />
      </section>
    </div>
  );
}
