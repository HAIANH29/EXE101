import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
};

export const BottomNavBar = ({ active, navigation }: BottomNavBarProps) => (
  <View style={styles.bottomBar}>
    {NAV_ITEMS.map((item) => {
      const isActive = active === item.key;
      return (
        <TouchableOpacity
          key={item.key}
          style={[styles.navItem, isActive && styles.navItemActive]}
          onPress={() => {
            if (!isActive && item.route) navigation.navigate(item.route);
          }}
        >
          <AppIcon name={item.icon} size={18} color={isActive ? '#005C55' : '#3E4947'} />
          <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
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
    borderTopColor: '#E2E8F0',
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
    backgroundColor: 'rgba(15, 118, 110, 0.15)'
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#3E4947'
  },
  navLabelActive: {
    color: '#005C55',
    fontWeight: '700'
  }
});