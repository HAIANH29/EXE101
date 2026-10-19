import { FormEvent, useEffect, useState } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { adminApi } from '../../services/adminApi';
import { AdminUserStatus, CreateSalonOwnerInput } from '../../types/admin';
import { UserAccount } from '../../types/salon';
import { Pager, StatusPill } from './AdminParts';

type AdminUsersProps = {
  currentUserId?: number;
};

const FILTERS: (AdminUserStatus | '')[] = ['', 'ACTIVE', 'BANNED', 'INACTIVE'];
const COLUMNS = '1.7fr 1fr 1fr 0.8fr 1fr 1.2fr';

const EMPTY_CREATE_FORM: CreateSalonOwnerInput = {
  fullName: '',
  email: '',
  password: '',
  phone: ''
};

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
  const [notice, setNotice] = useState<string>();
  const [busyId, setBusyId] = useState<number>();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSalonOwnerInput>(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string>();

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

  const handleCreateSalonOwner = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setCreateError(undefined);
    try {
      const created = await adminApi.createSalonOwner({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone?.trim() || undefined
      });
      setNotice(at('usCreatedSuccess', { email: created.email }));
      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreateModal(false);
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : at('genericError'));
    } finally {
      setCreating(false);
    }
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
        <div className="header-actions">
          <button
            type="button"
            className="solid-button"
            onClick={() => {
              setCreateError(undefined);
              setShowCreateModal(true);
            }}
          >
            + {at('usCreateSalonOwner')}
          </button>
          <button type="button" className="ghost-button" onClick={() => void load()}>
            {loading ? at('loading') : at('refresh')}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {showCreateModal && (
        <div className="admin-modal-backdrop" onClick={() => !creating && setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h3>{at('usCreateSalonOwner')}</h3>
                <p>{at('usCreateSalonOwnerDesc')}</p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                disabled={creating}
                onClick={() => setShowCreateModal(false)}
                aria-label={at('close')}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              {createError && <div className="error-banner">{createError}</div>}
              <form className="form-grid" onSubmit={handleCreateSalonOwner}>
                <label className="full">
                  {at('usFullName')}
                  <input
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    required
                    maxLength={150}
                    placeholder="Nguyen Van A"
                    autoFocus
                  />
                </label>
                <label className="full">
                  {at('usEmail')}
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    placeholder="owner@stylelock.test"
                  />
                </label>
                <label className="full">
                  {at('usPassword')}
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    minLength={8}
                    maxLength={100}
                    placeholder={at('usPasswordHint')}
                  />
                </label>
                <label className="full">
                  {at('usPhoneOptional')}
                  <input
                    type="tel"
                    value={createForm.phone || ''}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="0912345678"
                  />
                </label>
                <div className="admin-modal-actions full">
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={creating}
                    onClick={() => setShowCreateModal(false)}
                  >
                    {at('cancel')}
                  </button>
                  <button type="submit" className="solid-button" disabled={creating}>
                    {creating ? at('usCreating') : at('usCreateSalonOwner')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
