import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminUserStatus } from '../../types/admin';
import { UserAccount } from '../../types/salon';
import { Pager, StatusPill } from './AdminParts';

type AdminUsersProps = {
  currentUserId?: number;
};

const FILTERS: (AdminUserStatus | '')[] = ['', 'ACTIVE', 'BANNED', 'INACTIVE'];
const COLUMNS = '1.7fr 1fr 1fr 0.8fr 1fr 1.2fr';

export function AdminUsers({ currentUserId }: AdminUsersProps) {
  const { date } = useI18n();
  const at = useAdminT();
  const [filter, setFilter] = useState<AdminUserStatus | ''>('');
  const [pageNo, setPageNo] = useState(0);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<number>();

  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const result = await adminApi.getUsers(filter, pageNo);
      setUsers(result.content || []);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [filter, pageNo]);

  const changeFilter = (next: AdminUserStatus | '') => {
    setPageNo(0);
    setFilter(next);
  };

  const setStatus = async (user: UserAccount, status: AdminUserStatus) => {
    if (status === 'BANNED' && !window.confirm(at('usBanConfirm', { email: user.email }))) return;
    setBusyId(user.id);
    setError(undefined);
    try {
      const updated = await adminApi.updateUserStatus(user.id, status);
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, ...updated } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setBusyId(undefined);
    }
  };

  const remove = async (user: UserAccount) => {
    if (!window.confirm(at('usDeleteConfirm', { email: user.email }))) return;
    setBusyId(user.id);
    setError(undefined);
    try {
      await adminApi.deleteUser(user.id);
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
          <span className="eyebrow">{at('tabUsers')}</span>
          <h2>{at('usTitle')}</h2>
          <p>{at('usDesc')} · {at('usTotal', { count: totalElements })}</p>
        </div>
        <button className="ghost-button" onClick={() => void load()}>
          {loading ? at('loading') : at('refresh')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="status-tabs">
        {FILTERS.map((item) => (
          <button key={item || 'ALL'} className={filter === item ? 'active' : ''} onClick={() => changeFilter(item)}>
            {item ? at(`st_${item}`) : at('all')}
          </button>
        ))}
      </div>

      <section className="panel">
        {!loading && users.length === 0 ? (
          <div className="empty-row">{at('usEmpty')}</div>
        ) : (
          <div className="appointments-table">
            <div className="table-head" style={{ gridTemplateColumns: COLUMNS }}>
              <span>{at('usUser')}</span>
              <span>{at('usPhone')}</span>
              <span>{at('usRoles')}</span>
              <span>{at('status')}</span>
              <span>{at('created')}</span>
              <span>{at('actions')}</span>
            </div>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const busy = busyId === user.id;
              return (
                <div className="table-row" key={user.id} style={{ gridTemplateColumns: COLUMNS }}>
                  <span>
                    <b>{user.fullName}</b>
                    <small>{user.email}</small>
                  </span>
                  <span>{user.phone || '—'}</span>
                  <span>{(user.roles || []).join(', ') || '—'}</span>
                  <span>
                    <StatusPill status={user.status} label={user.status ? at(`st_${user.status}`) : '—'} />
                  </span>
                  <span>{user.createdAt ? date(user.createdAt) : '—'}</span>
                  <span className="row-actions">
                    {isSelf ? (
                      <small>{at('usSelf')}</small>
                    ) : (
                      <>
                        {user.status === 'BANNED' ? (
                          <button className="mini success" disabled={busy} onClick={() => void setStatus(user, 'ACTIVE')}>
                            {at('usUnban')}
                          </button>
                        ) : (
                          <button className="mini danger" disabled={busy} onClick={() => void setStatus(user, 'BANNED')}>
                            {at('usBan')}
                          </button>
                        )}
                        <button className="mini danger" disabled={busy} onClick={() => void remove(user)}>
                          {at('usDelete')}
                        </button>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <Pager page={pageNo} totalPages={totalPages} onChange={setPageNo} />
      </section>
    </div>
  );
}
