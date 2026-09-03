import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Switch,
  Alert
} from 'react-native';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => navigation.replace('Login')
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.topIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert('Thông báo', 'Bạn có 2 thông báo mới từ Salon Luxe Studio')}
        >
          <View style={styles.bellBadgeWrap}>
            <Text style={styles.topIcon}>🔔</Text>
            <View style={styles.redDot} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
              }}
              style={styles.avatarImg}
            />
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={() => Alert.alert('Thay đổi ảnh', 'Chọn ảnh chân dung mới cho tài khoản')}
            >
              <Text style={styles.editAvatarIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>Eleanor Vance</Text>
          <Text style={styles.userEmail}>eleanor.v@example.com</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => Alert.alert('Chỉnh sửa thông tin', 'Chức năng cập nhật hồ sơ cá nhân')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section Group 1 */}
        <View style={styles.menuGroup}>
          {/* Favorite Hairstyles */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('HairstyleSelect')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Text style={styles.menuIconText}>❤️</Text>
              </View>
              <Text style={styles.menuTitle}>Favorite Hairstyles</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>

          {/* Saved Salons */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('SalonList')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Text style={styles.menuIconText}>🏪</Text>
              </View>
              <Text style={styles.menuTitle}>Saved Salons</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>

          {/* Notification Settings */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setNotificationsEnabled(!notificationsEnabled);
              Alert.alert(
                'Thông báo',
                !notificationsEnabled ? 'Đã bật nhận thông báo' : 'Đã tắt nhận thông báo'
              );
            }}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Text style={styles.menuIconText}>🔔</Text>
              </View>
              <Text style={styles.menuTitle}>Notification Settings</Text>
            </View>
            <Text style={styles.chevronIcon}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section Group 2 */}
        <View style={styles.menuGroup}>
          {/* Dark Mode Toggle */}
          <View style={[styles.menuItem, styles.menuItemBorder]}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <Text style={styles.menuIconText}>🌙</Text>
              </View>
              <Text style={styles.menuTitle}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#BDC9C6', true: '#005C55' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, styles.logoutIconBg]}>
                <Text style={styles.logoutIconText}>🚪</Text>
              </View>
              <Text style={styles.logoutTitle}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <Text style={styles.versionText}>StyleLock v2.4.1</Text>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('HairstyleSelect')}>
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CameraUpload')}>
          <Text style={styles.navIcon}>✨</Text>
          <Text style={styles.navLabel}>AI Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('BookingHistory')}>
          <Text style={styles.navIcon}>📅</Text>
          <Text style={styles.navLabel}>Bookings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Text style={[styles.navIcon, styles.navIconActive]}>👤</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA'
  },
  topAppBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(250, 250, 250, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEFF',
    zIndex: 10
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topIcon: {
    fontSize: 20,
    color: '#005C55'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#005C55',
    letterSpacing: -0.5
  },
  bellBadgeWrap: {
    position: 'relative'
  },
  redDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#BA1A1A'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16
  },
  avatarImg: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E6EEFF'
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#005C55',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4
  },
  editAvatarIcon: {
    fontSize: 14
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121C2A',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#3E4947',
    marginBottom: 16
  },
  editProfileBtn: {
    backgroundColor: '#E6E2DC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24
  },
  editProfileText: {
    color: '#1C1C18',
    fontSize: 14,
    fontWeight: '600'
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(189, 201, 198, 0.3)',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 2
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 227, 246, 0.5)'
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(217, 227, 246, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutIconBg: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)'
  },
  menuIconText: {
    fontSize: 18
  },
  logoutIconText: {
    fontSize: 18
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121C2A'
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#BA1A1A'
  },
  chevronIcon: {
    fontSize: 20,
    color: '#3E4947',
    fontWeight: '300'
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6E7977',
    marginTop: 12
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    borderRadius: 20
  },
  navItemActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.15)'
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  navIconActive: {
    transform: [{ scale: 1.1 }]
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
