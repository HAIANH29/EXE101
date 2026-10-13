import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon, AppIconName } from './AppIcon';

type NavKey = 'Home' | 'Explore' | 'AICamera' | 'Salons' | 'Bookings' | 'History' | 'Profile';

type NavItem = {
  key: NavKey;
  label: string;
  route?: string;
  icon: AppIconName;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'Home', label: 'Home', route: 'Home', icon: 'home' },
  { key: 'Explore', label: 'Explore', route: 'HairstyleSelect', icon: 'search' },
  { key: 'AICamera', label: 'AI Camera', route: 'CameraUpload', icon: 'sparkle' },
  { key: 'Salons', label: 'Salons', route: 'SalonList', icon: 'salon' },
  { key: 'History', label: 'History', route: 'BookingHistory', icon: 'calendar' }
];

type BottomNavBarProps = {
  active: NavKey;
  navigation: any;
  labels?: Partial<Record<NavKey, string>>;
};

export const BottomNavBar = ({ active, navigation, labels }: BottomNavBarProps) => (
  <View style={styles.bottomBar}>
    {NAV_ITEMS.map((item) => {
      const isActive = active === item.key;
      const label = labels?.[item.key] || item.label;
      return (
        <TouchableOpacity
          key={item.key}
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => {
            if (!isActive && item.route) navigation.navigate(item.route);
          }}
        >
          <View style={[styles.iconBadge, isActive && styles.iconBadgeActive]}>
            <AppIcon
              name={item.icon}
              size={20}
              color={isActive ? '#B8895A' : '#6F6255'}
            />
          </View>
          <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5D9CA',
    zIndex: 50,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 8 },
      web: { boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)' }
    })
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    flex: 1
  },
  iconBadge: {
    width: 44,
    height: 30,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconBadgeActive: {
    backgroundColor: '#F3E7D8'
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6F6255'
  },
  navLabelActive: {
    color: '#B8895A',
    fontWeight: '700'
  }
});


