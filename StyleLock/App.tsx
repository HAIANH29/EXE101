import { useEffect, useState } from 'react';
import {
  StatusBar } from 'expo-status-bar';
import { getPathFromState as defaultGetPathFromState,
  createNavigationContainerRef,
  NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator,
  Platform,
  StyleSheet,
  View
} from 'react-native';
import { LocalizedText as Text } from './src/i18n/LocalizedComponents';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { backendApi } from './src/services/backendApi';
import { authSessionStore } from './src/services/apiClient';
import { trackVisit } from './src/services/trafficTracker';
import { configurePushHandling, registerForPush } from './src/services/pushNotifications';
import { WebShell } from './src/web/WebShell';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { palette } from './src/theme/palette';

const MAX_URL_LENGTH = 2000;

const linking = {
  prefixes: ['http://localhost:8082', 'http://localhost:8081', 'stylelock://'],
  // Tham số route lớn (vd: ảnh chụp dạng data URL) sẽ bị đưa vào URL trình duyệt và làm đứng trang.
  // Nếu URL sinh ra quá dài thì bỏ phần query, chỉ giữ đường dẫn màn hình.
  getPathFromState: (state: any, options: any) => {
    const path = defaultGetPathFromState(state, options);
    return path.length > MAX_URL_LENGTH ? path.split('?')[0] : path;
  },
  config: {
    screens: {
      Login: '',
      SignUp: 'sign-up',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Home: 'home',
      CameraUpload: 'camera',
      HairstyleSelect: 'hairstyles',
      HairstyleDetail: 'hairstyles/:id',
      TryOnEditor: 'try-on',
      SalonList: 'salons',
      SalonDetail: 'salons/:id',
      BookingStatus: 'booking/status',
      BookingHistory: 'bookings',
      Profile: 'profile',
      SalonDashboard: 'salon-dashboard',
      AdminDashboard: 'admin-dashboard'
    }
  }
};

const navigationRef = createNavigationContainerRef<any>();

function resetToLogin() {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState(null, '', '/');
  }
}

const AuthLoadingScreen = () => (
  <View style={styles.authLoading}>
    <ActivityIndicator size="large" color={palette.primary} />
    <Text style={styles.authLoadingText}>Checking your session...</Text>
  </View>
);

export default function App() {
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(
    backendApi.isAuthenticated()
  );
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [routeName, setRouteName] = useState<string | undefined>();
  const [expiredSessionVersion, setExpiredSessionVersion] = useState(0);

  useEffect(() => {
    trackVisit();
  }, []);

  // Thông báo đẩy: đăng ký token khi đã đăng nhập (kể cả đăng nhập mới), bấm vào thông báo -> mở màn Thông báo
  useEffect(() => {
    const stopHandling = configurePushHandling(() => {
      if (navigationRef.isReady() && backendApi.isAuthenticated()) {
        navigationRef.navigate('Notifications');
      }
    });
    if (backendApi.isAuthenticated()) void registerForPush();
    const unsubscribe = authSessionStore.subscribe((event) => {
      if (event.type === 'set') void registerForPush();
    });
    return () => {
      stopHandling();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const validateExistingSession = async () => {
      if (!backendApi.isAuthenticated()) {
        if (active) setIsBootstrappingSession(false);
        return;
      }

      const isValid = await backendApi.validateSession();
      if (active && !isValid) {
        setExpiredSessionVersion((version) => version + 1);
      }
      if (active) setIsBootstrappingSession(false);
    };

    void validateExistingSession();

    const unsubscribe = authSessionStore.subscribe((event) => {
      if (event.type === 'clear' && event.reason === 'expired') {
        setExpiredSessionVersion((version) => version + 1);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isNavigationReady && expiredSessionVersion > 0) {
      resetToLogin();
    }
  }, [expiredSessionVersion, isNavigationReady]);

  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onReady={() => {
            setIsNavigationReady(true);
            setRouteName(navigationRef.getCurrentRoute()?.name);
            if (expiredSessionVersion > 0) {
              resetToLogin();
            }
          }}
          onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name)}
        >
          <StatusBar style="dark" />
          {/* WebShell chỉ có tác dụng trên web rộng; mobile / web hẹp render y như cũ */}
          <WebShell routeName={routeName} onNavigate={(route) => navigationRef.navigate(route)}>
            {isBootstrappingSession ? <AuthLoadingScreen /> : <AppNavigator />}
          </WebShell>
        </NavigationContainer>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    gap: 12
  },
  authLoadingText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700'
  }
});
