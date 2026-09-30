import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon, AppIconName } from './AppIcon';

type NavKey = 'Home' | 'Explore' | 'AICamera' | 'Bookings' | 'Profile';

type NavItem = {
  key: NavKey;
  label: string;
  route?: string;
  icon: AppIconName;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'Home', label: 'Home', route: 'Home', icon: 'home' },
  { key: 'Explore', label: 'Explore', route: 'HairstyleSelect', icon: 'search' },
  { key: 'AICamera', label: 'AI Camera', route: 'CameraUpload', icon: 'camera' },
  { key: 'Bookings', label: 'Bookings', route: 'BookingHistory', icon: 'calendar' },
  { key: 'Profile', label: 'Profile', route: 'Profile', icon: 'user' }
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
          style={[styles.navItem, isActive && styles.navItemActive]}
          onPress={() => {
            if (!isActive && item.route) navigation.navigate(item.route);
          }}
        >
          <AppIcon name={item.icon} size={18} color={isActive ? '#A97845' : '#6F6256'} />
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
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DDCDB9',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 2
  },
  navItemActive: {
    backgroundColor: 'rgba(169, 120, 69, 0.16)'
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6F6256'
  },
  navLabelActive: {
    color: '#A97845',
    fontWeight: '700'
  }
});
