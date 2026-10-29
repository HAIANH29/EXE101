import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { NavigationTab, Salon, UserAccount } from '../../types/salon';
import styleLockLogo from '../../assets/stylelock-logo-transparent.png';

type ShellProps = {
  currentTab: NavigationTab;
  salons: Salon[];
  selectedSalonId?: number;
  user?: UserAccount;
  onTabChange: (tab: NavigationTab) => void;
  onSalonChange: (salonId: number) => void;
  onCreateSalon: () => void;
  onLogout: () => void;
  children: ReactNode;
};

const navItems: { label: NavigationTab; icon: string; hintKey: string; labelKey: string }[] = [
  { label: 'Dashboard', icon: 'dashboard', hintKey: 'overview', labelKey: 'dashboard' },
  { label: 'Appointments', icon: 'calendar_month', hintKey: 'bookingFlow', labelKey: 'appointments' },
  { label: 'Customers', icon: 'group', hintKey: 'crm', labelKey: 'customers' },
  { label: 'Services', icon: 'content_cut', hintKey: 'catalog', labelKey: 'services' },
  { label: 'Staff', icon: 'badge', hintKey: 'stylists', labelKey: 'staff' },
  { label: 'Analytics', icon: 'analytics', hintKey: 'reports', labelKey: 'analytics' },
  { label: 'Settings', icon: 'settings', hintKey: 'salonProfile', labelKey: 'settings' },
  { label: 'Subscription', icon: 'workspace_premium', hintKey: 'plan', labelKey: 'subscription' }
];

export function Shell({
  currentTab,
  salons,
  selectedSalonId,
  user,
  onTabChange,
  onSalonChange,
  onCreateSalon,
  onLogout,
  children
}: ShellProps) {
  const { language, toggleLanguage, t } = useI18n();
  const selectedSalon = salons.find((salon) => salon.id === selectedSalonId);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="brand-block">
            <img className="brand-logo" src={styleLockLogo} alt="StyleLock" />
            <div>
              <h1>StyleLock</h1>
              <span>{t('salonManagement')}</span>
            </div>
          </div>

          <button className="primary-action" onClick={onCreateSalon}>
            <span className="material-symbols-outlined">add_business</span>
            {t('addBranch')}
          </button>

          <nav className="side-nav">
            {navItems.map((item) => {
              const active = currentTab === item.label;
              return (
                <button
                  key={item.label}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => onTabChange(item.label)}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="nav-copy">
                    <strong>{t(item.labelKey)}</strong>
                    <small>{t(item.hintKey)}</small>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="manager-card">
          <div className="avatar">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName} /> : user?.fullName?.slice(0, 2).toUpperCase() || 'SL'}
          </div>
          <div className="manager-info" title={`${user?.fullName || t('ownerAccount')} (${user?.email || ''})`}>
            <strong>{user?.fullName || t('ownerAccount')}</strong>
            <span>{user?.email || t('ownerAccount')}</span>
          </div>
          <button className="icon-button light logout-button" onClick={onLogout} title={t('logout')}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="search-box">
            <span className="material-symbols-outlined">search</span>
            <input placeholder={t('searchPlaceholder')} />
          </div>

          <div className="topbar-actions">
            <select
              value={selectedSalonId || ''}
              onChange={(event) => onSalonChange(Number(event.target.value))}
              disabled={salons.length === 0}
            >
              {salons.length === 0 ? (
                <option>{t('noBranchYet')}</option>
              ) : (
                salons.map((salon) => (
                  <option key={salon.id} value={salon.id}>
                    {salon.name}
                  </option>
                ))
              )}
            </select>
            <button className="icon-button language-toggle" onClick={toggleLanguage} title={language === 'vi' ? 'Switch to English' : 'Đổi sang tiếng Việt'}>
              {language === 'vi' ? 'EN' : 'VI'}
            </button>
            <button className="icon-button" title={t('notificationsNotReady')}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="topbar-button secondary" onClick={onCreateSalon}>
              <span className="material-symbols-outlined">add_business</span>
              {t('addBranch')}
            </button>
            <button className="topbar-button" onClick={() => onTabChange('Settings')}>
              {t('manageBranch')}
            </button>
          </div>
        </header>

        <main className="page">
          <div className="page-kicker">
            <span>{selectedSalon?.status || t('branchWorkspace')}</span>
            <span>{selectedSalon?.address || t('addBranchPrompt')}</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
