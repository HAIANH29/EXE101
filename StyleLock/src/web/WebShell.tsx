import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { BrandLogo } from '../components/BrandLogo';
import { authSessionStore } from '../services/apiClient';
import { backendApi } from '../services/backendApi';
import { palette } from '../theme/palette';
import { useWebLayout, WEB_CONTENT_MAX_WIDTH } from './useWebLayout';

type NavKey = 'Home' | 'Explore' | 'AICamera' | 'Salons' | 'History';

const NAV_ITEMS: { key: NavKey; label: string; route: string; icon: AppIconName }[] = [
  { key: 'Home', label: 'Home', route: 'Home', icon: 'home' },
  { key: 'Explore', label: 'Explore', route: 'HairstyleSelect', icon: 'search' },
  { key: 'AICamera', label: 'AI Camera', route: 'CameraUpload', icon: 'sparkle' },
  { key: 'Salons', label: 'Salons', route: 'SalonList', icon: 'salon' },
  { key: 'History', label: 'History', route: 'BookingHistory', icon: 'calendar' }
];

const ROUTE_TO_NAV: Record<string, NavKey | 'Profile' | 'Notifications'> = {
  Home: 'Home',
  HairstyleSelect: 'Explore',
  HairstyleDetail: 'Explore',
  CameraUpload: 'AICamera',
  TryOnEditor: 'AICamera',
  SalonList: 'Salons',
  SalonDetail: 'Salons',
  BookingHistory: 'History',
  BookingStatus: 'History',
  Payment: 'History',
  PaymentHistory: 'History',
  Profile: 'Profile',
  Notifications: 'Notifications'
};

const AUTH_ROUTES = ['Login', 'SignUp', 'ForgotPassword', 'ResetPassword'];

/** Màn nhiều chữ / dạng danh sách đọc dễ hơn khi cột nội dung hẹp lại (px). Màn không liệt kê dùng full 1200. */
const ROUTE_MAX_WIDTH: Record<string, number> = {
  Profile: 920,
  BookingHistory: 1000,
  Notifications: 800,
  Payment: 820,
  PaymentHistory: 900,
  BookingStatus: 1000,
  CameraUpload: 780,
  TryOnEditor: 820,
  HairstyleDetail: 920,
  SalonDetail: 1040
};

/** Màu nền riêng cho vài màn (khớp với nền của chính màn đó) để vùng ngoài khung nội dung không bị lệch màu. */
const ROUTE_BG: Record<string, string> = {
  HairstyleSelect: '#FAF7F2',
  CameraUpload: '#241F1A'
};

type WebShellProps = {
  routeName?: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
};

/**
 * Khung bố cục cho WEB RỘNG: thanh điều hướng trên cùng + vùng nội dung căn giữa.
 * Trên mobile / web hẹp component này chỉ trả về children nguyên vẹn (giao diện mobile không đổi).
 */
export const WebShell = ({ routeName, onNavigate, children }: WebShellProps) => {
  const { isWide } = useWebLayout();
  const [authed, setAuthed] = useState(authSessionStore.isAuthenticated());

  useEffect(() => {
    const unsubscribe = authSessionStore.subscribe(() => setAuthed(authSessionStore.isAuthenticated()));
    return unsubscribe;
  }, []);

  if (!isWide) return <>{children}</>;

  const isAuthRoute = !authed || (routeName ? AUTH_ROUTES.includes(routeName) : false);

  if (isAuthRoute) {
    return (
      <View style={styles.authRoot}>
        <View style={styles.brandPanel}>
          <View style={styles.brandLogoBox}>
            <BrandLogo containerStyle={styles.brandLogo} />
          </View>
          <Text style={styles.brandName}>StyleLock</Text>
          <Text style={styles.brandTagline}>Thử là hợp – Chốt là xinh</Text>
          <View style={styles.brandPoints}>
            {[
              'Thử kiểu tóc ảo bằng AI ngay trên ảnh của bạn',
              'Tìm salon làm đúng kiểu tóc bạn chọn',
              'Đặt lịch và thanh toán nhanh trong vài bước'
            ].map((point) => (
              <View key={point} style={styles.brandPointRow}>
                <AppIcon name="sparkle" size={16} color="#F3E7D8" />
                <Text style={styles.brandPointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.authFormPanel}>
          <View style={styles.authFormInner}>{children}</View>
        </View>
      </View>
    );
  }

  const activeKey = routeName ? ROUTE_TO_NAV[routeName] : undefined;

  return (
    <View style={[styles.root, routeName && ROUTE_BG[routeName] ? { backgroundColor: ROUTE_BG[routeName] } : null]}>
      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <TouchableOpacity style={styles.brand} activeOpacity={0.8} onPress={() => onNavigate('Home')}>
            <BrandLogo containerStyle={styles.brandMark} />
            <Text style={styles.brandText}>StyleLock</Text>
          </TouchableOpacity>

          <View style={styles.links}>
            {NAV_ITEMS.map((item) => {
              const active = activeKey === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.link, active && styles.linkActive]}
                  activeOpacity={0.75}
                  onPress={() => !active && onNavigate(item.route)}
                >
                  <AppIcon name={item.icon} size={17} color={active ? palette.primaryDark : palette.textSoft} />
                  <Text style={[styles.linkText, active && styles.linkTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <WebBell routeName={routeName} active={activeKey === 'Notifications'} onPress={() => onNavigate('Notifications')} />
            <TouchableOpacity
              style={[styles.iconBtn, activeKey === 'Profile' && styles.iconBtnActive]}
              activeOpacity={0.8}
              onPress={() => onNavigate('Profile')}
              accessibilityLabel="Profile"
            >
              <AppIcon name="user" size={20} color={palette.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.content, routeName && ROUTE_MAX_WIDTH[routeName] ? { maxWidth: ROUTE_MAX_WIDTH[routeName] } : null]}>
        {children}
      </View>
    </View>
  );
};

/** Chuông thông báo cho thanh trên cùng (không dùng useFocusEffect vì nằm ngoài Stack navigator). */
const WebBell = ({ routeName, active, onPress }: { routeName?: string; active: boolean; onPress: () => void }) => {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!backendApi.isAuthenticated()) {
      setUnread(0);
      return;
    }
    backendApi
      .getUnreadNotificationCount()
      .then((count) => !cancelled && setUnread(count))
      .catch(() => !cancelled && setUnread(0));
    return () => {
      cancelled = true;
    };
  }, [routeName]);

  return (
    <TouchableOpacity
      style={[styles.iconBtn, active && styles.iconBtnActive]}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityLabel="Notifications"
    >
      <View>
        <AppIcon name="bell" size={20} color={palette.primary} />
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  topBar: {
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    zIndex: 100
  },
  topBarInner: {
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 34, height: 34 },
  brandText: { fontSize: 22, fontWeight: '800', color: palette.primary, letterSpacing: -0.5 },
  links: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999
  },
  linkActive: { backgroundColor: palette.primarySoft },
  linkText: { fontSize: 14, fontWeight: '600', color: palette.textSoft },
  linkTextActive: { color: palette.primaryDark, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBtnActive: { backgroundColor: palette.primarySoft },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.danger,
    borderWidth: 2,
    borderColor: palette.surface
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', lineHeight: 12 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH,
    alignSelf: 'center'
  },

  // ----- Đăng nhập / đăng ký: chia đôi màn hình -----
  authRoot: { flex: 1, flexDirection: 'row', backgroundColor: palette.background },
  brandPanel: {
    flex: 1,
    backgroundColor: palette.primaryDark,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 72,
    gap: 14
  },
  brandLogoBox: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  brandLogo: { width: 84, height: 84 },
  brandName: { fontSize: 44, fontWeight: '800', color: '#FFFDF9', letterSpacing: -1 },
  brandTagline: { fontSize: 20, color: '#F3E7D8', fontWeight: '600' },
  brandPoints: { marginTop: 28, gap: 14 },
  brandPointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandPointText: { fontSize: 15, color: '#F3E7D8', lineHeight: 22, flexShrink: 1 },
  authFormPanel: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  authFormInner: { flex: 1, width: '100%', maxWidth: 520 }
});
