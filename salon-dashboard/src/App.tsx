import { useEffect, useMemo, useState } from 'react';
import { Shell } from './components/layout/Shell';
import { AnalyticsView } from './components/screens/AnalyticsView';
import { AppointmentsView } from './components/screens/AppointmentsView';
import { CustomersView } from './components/screens/CustomersView';
import { DashboardOverview } from './components/screens/DashboardOverview';
import { LoginScreen } from './components/screens/LoginScreen';
import { PlaceholderView } from './components/screens/PlaceholderView';
import { ServicesView } from './components/screens/ServicesView';
import { SettingsView } from './components/screens/SettingsView';
import { StaffView } from './components/screens/StaffView';
import { SubscriptionView } from './components/screens/SubscriptionView';
import { useI18n } from './i18n';
import { salonApi } from './services/api';
import { NavigationTab, Salon, UserAccount } from './types/salon';
import styleLockLogo from './assets/stylelock-logo-transparent.png';
import { AdminShell } from './components/admin/AdminShell';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminUsers } from './components/admin/AdminUsers';
import { AdminCatalog } from './components/admin/AdminCatalog';
import { AdminPayments } from './components/admin/AdminPayments';
import { AdminTab } from './types/admin';

function isAdminUser(user?: UserAccount) {
  return Boolean(user?.roles?.includes('ADMIN'));
}

function hasOwnerRole(user?: UserAccount) {
  return Boolean(user?.roles?.includes('SALON_OWNER') || isAdminUser(user));
}

export function App() {
  const { t } = useI18n();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('Dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('Overview');
  const [user, setUser] = useState<UserAccount | undefined>(salonApi.getStoredSession()?.user);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState<number | undefined>();
  const [creatingSalon, setCreatingSalon] = useState(false);
  const [authError, setAuthError] = useState<string>();
  const [booting, setBooting] = useState(true);

  const selectedSalon = useMemo(
    () => salons.find((salon) => salon.id === selectedSalonId),
    [salons, selectedSalonId]
  );

  const loadSalons = async (preferredSalonId?: number) => {
    const ownerSalons = await salonApi.getMySalons();
    const hydrated = await Promise.all(
      ownerSalons.map((salon) => salonApi.getSalonDetail(salon.id).catch(() => salon))
    );
    setSalons(hydrated);
    setSelectedSalonId((current) => {
      if (preferredSalonId && hydrated.some((salon) => salon.id === preferredSalonId)) {
        return preferredSalonId;
      }
      if (current && hydrated.some((salon) => salon.id === current)) {
        return current;
      }
      return hydrated[0]?.id;
    });
  };

  const handleTabChange = (tab: NavigationTab) => {
    if (tab !== 'Settings') setCreatingSalon(false);
    setCurrentTab(tab);
  };

  const handleSalonChange = (salonId: number) => {
    setCreatingSalon(false);
    setSelectedSalonId(salonId);
  };

  const handleCreateSalon = () => {
    setCreatingSalon(true);
    setCurrentTab('Settings');
  };

  useEffect(() => {
    let active = true;

    const boot = async () => {
      if (!salonApi.isAuthenticated()) {
        setBooting(false);
        return;
      }

      try {
        const me = await salonApi.getMe();
        if (!active) return;
        setUser(me);
        if (!hasOwnerRole(me)) {
          setAuthError(t('missingOwnerRole'));
          return;
        }
        if (!isAdminUser(me)) await loadSalons();
      } catch {
        if (active) setUser(undefined);
      } finally {
        if (active) setBooting(false);
      }
    };

    void boot();
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(undefined);
    const session = await salonApi.login(email, password);
    const me = session.user;
    setUser(me);
    if (!hasOwnerRole(me)) {
      setAuthError(t('loginNoOwnerRole'));
      return;
    }
    if (!isAdminUser(me)) await loadSalons();
  };

  const handleLogout = async () => {
    await salonApi.logout();
    setUser(undefined);
    setSalons([]);
    setSelectedSalonId(undefined);
    setCreatingSalon(false);
    setCurrentTab('Dashboard');
    setAdminTab('Overview');
  };

  const refreshAfterSettingsSave = async (preferredSalonId?: number) => {
    await loadSalons(preferredSalonId);
    setCreatingSalon(false);
  };

  const renderScreen = () => {
    switch (currentTab) {
      case 'Dashboard':
        return <DashboardOverview salon={selectedSalon} onNavigate={handleTabChange} />;
      case 'Appointments':
        return <AppointmentsView salon={selectedSalon} />;
      case 'Customers':
        return <CustomersView salon={selectedSalon} />;
      case 'Services':
        return <ServicesView salon={selectedSalon} />;
      case 'Staff':
        return <StaffView salon={selectedSalon} />;
      case 'Analytics':
        return <AnalyticsView salon={selectedSalon} />;
      case 'Settings':
        return (
          <SettingsView
            salon={creatingSalon ? undefined : selectedSalon}
            hasExistingSalons={salons.length > 0}
            onCancelCreate={() => setCreatingSalon(false)}
            onRefreshSalons={refreshAfterSettingsSave}
          />
        );
      case 'Subscription':
        return <SubscriptionView salon={selectedSalon} />;
      default:
        return <PlaceholderView tab={currentTab} />;
    }
  };

  if (booting) {
    return (
      <div className="boot-screen">
        <img className="brand-logo large" src={styleLockLogo} alt="StyleLock" />
        <p>{t('booting')}</p>
      </div>
    );
  }

  if (!user || authError) {
    return <LoginScreen error={authError} onLogin={handleLogin} />;
  }

  if (isAdminUser(user)) {
    return (
      <AdminShell currentTab={adminTab} user={user} onTabChange={setAdminTab} onLogout={handleLogout}>
        {adminTab === 'Overview' && <AdminOverview onNavigate={setAdminTab} />}
        {adminTab === 'Users' && <AdminUsers currentUserId={user.id} />}
        {adminTab === 'Catalog' && <AdminCatalog />}
        {adminTab === 'Payments' && <AdminPayments />}
      </AdminShell>
    );
  }

  return (
    <Shell
      currentTab={currentTab}
      salons={salons}
      selectedSalonId={selectedSalonId}
      user={user}
      onTabChange={handleTabChange}
      onSalonChange={handleSalonChange}
      onCreateSalon={handleCreateSalon}
      onLogout={handleLogout}
    >
      {renderScreen()}
    </Shell>
  );
}

export default App;
