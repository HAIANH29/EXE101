import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { useAdminT } from '../../adminI18n';
import { usePayT } from '../../payI18n';
import { AdminTab } from '../../types/admin';
import { UserAccount } from '../../types/salon';
import { adminApi } from '../../services/adminApi';
import styleLockLogo from '../../assets/stylelock-logo-transparent.png';

type AdminShellProps = {
  currentTab: AdminTab;
  user?: UserAccount;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  children: ReactNode;
};

const navItems: { tab: AdminTab; icon: string; labelKey: string; hintKey: string; pay?: boolean }[] = [
  { tab: 'Overview', icon: 'dashboard', labelKey: 'tabOverview', hintKey: 'hintOverview' },
  { tab: 'Salons', icon: 'storefront', labelKey: 'tabSalons', hintKey: 'hintSalons' },
  { tab: 'Users', icon: 'group', labelKey: 'tabUsers', hintKey: 'hintUsers' },
  { tab: 'Catalog', icon: 'content_cut', labelKey: 'tabCatalog', hintKey: 'hintCatalog' },
  { tab: 'Payments', icon: 'payments', labelKey: 'adTabPayments', hintKey: 'adHintPayments', pay: true }
];

export function AdminShell({ currentTab, user, onTabChange, onLogout, children }: AdminShellProps) {
  const { language, toggleLanguage, t } = useI18n();
  const at = useAdminT();
  const pt = usePayT();
  const [pendingSalonsCount, setPendingSalonsCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      try {
        const ov = await adminApi.getOverview();
        if (mounted) setPendingSalonsCount(ov.pendingApprovalSalons || 0);
      } catch {
        // ignore
      }
    };
    void fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [currentTab]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-block">
            <img className="brand-logo" src={styleLockLogo} alt="StyleLock" />
            <div>
              <h1>StyleLock</h1>
              <span>{at('adminConsole')}</span>
            </div>
          </div>

          <nav className="side-nav admin-nav">
            {navItems.map((item) => (
              <button
                key={item.tab}
                className={`nav-item ${currentTab === item.tab ? 'active' : ''}`}
                onClick={() => onTabChange(item.tab)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="nav-copy">
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <strong>{item.pay ? pt(item.labelKey) : at(item.labelKey)}</strong>
                    {item.tab === 'Salons' && pendingSalonsCount > 0 && (
                      <span className="admin-nav-badge">{pendingSalonsCount}</span>
                    )}
                  </span>
                  <small>{item.pay ? pt(item.hintKey) : at(item.hintKey)}</small>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="manager-card">
          <div className="avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} /> : user?.fullName?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="manager-info" title={`${user?.fullName || 'Admin'} (${user?.email || ''})`}>
            <strong>{user?.fullName || 'Admin'}</strong>
            <span>{user?.email}</span>
          </div>
          <button className="icon-button light logout-button" onClick={onLogout} title={t('logout')}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="admin-topbar-title">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <strong>{at('adminPortal')}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button language-toggle"
              onClick={toggleLanguage}
              title={language === 'vi' ? 'Switch to English' : 'Đổi sang tiếng Việt'}
            >
              {language === 'vi' ? 'EN' : 'VI'}
            </button>
          </div>
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  );
}
