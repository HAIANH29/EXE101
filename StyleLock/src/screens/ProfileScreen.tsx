import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { backendApi } from '../services/backendApi';
import { AppIcon } from '../components/AppIcon';
import { bookingService } from '../services/bookingService';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(backendApi.getCurrentUser()?.user);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | undefined>();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState<boolean>(false);
  const [profileFullName, setProfileFullName] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  const isAuthenticated = backendApi.isAuthenticated();

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  };

  const loadProfile = useCallback(() => {
    let active = true;

    const run = async () => {
      if (!backendApi.isAuthenticated()) {
        if (active) {
          setCurrentUser(undefined);
          setProfileError('Bạn chưa đăng nhập.');
          setIsLoadingProfile(false);
        }
        return;
      }

      setIsLoadingProfile(true);
      try {
        const user = await backendApi.getMe();
        if (active) {
          setCurrentUser(user);
          setProfileError(undefined);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không tải được hồ sơ.';
        if (active) setProfileError(message);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(loadProfile);

  const resetPasswordForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const openEditProfileModal = () => {
    if (!currentUser) {
      goToLogin();
      return;
    }

    setProfileFullName(currentUser.fullName || '');
    setProfilePhone(currentUser.phone || '');
    setEditProfileModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập trước khi chỉnh sửa hồ sơ.');
      return;
    }

    const fullName = profileFullName.trim();
    if (!fullName) {
      Alert.alert('Thiếu họ tên', 'Họ tên không được để trống.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const user = await backendApi.updateProfile({
        fullName,
        phone: profilePhone.trim()
      });
      setCurrentUser(user);
      setEditProfileModalVisible(false);
      Alert.alert('Đã cập nhật', 'Hồ sơ của bạn đã được lưu thành công.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không cập nhật được hồ sơ.';
      Alert.alert('Cập nhật thất bại', message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập trước khi cập nhật ảnh đại diện.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Quyền truy cập ảnh', 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const asset = result.assets[0];
      setIsUploadingAvatar(true);
      const user = await backendApi.uploadAvatar({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType
      });
      setCurrentUser(user);
      Alert.alert('Đã cập nhật', 'Ảnh đại diện của bạn đã được lưu.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không upload được ảnh đại diện.';
      Alert.alert('Upload thất bại', message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập trước khi đổi mật khẩu.');
      return;
    }

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới cần ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Vui lòng nhập lại xác nhận mật khẩu mới.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await backendApi.changePassword({ oldPassword, newPassword });
      setPasswordModalVisible(false);
      resetPasswordForm();
      Alert.alert('Đổi mật khẩu thành công', 'Mật khẩu tài khoản của bạn đã được cập nhật.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không đổi được mật khẩu.';
      Alert.alert('Đổi mật khẩu thất bại', message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = (currentUser?.fullName || currentUser?.email || 'SL')
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = currentUser?.roles?.includes('ADMIN')
    ? 'Quản trị viên'
    : currentUser?.roles?.includes('SALON_OWNER')
      ? 'Chủ salon'
      : currentUser?.roles?.includes('STYLIST')
        ? 'Stylist'
        : currentUser?.roles?.includes('CUSTOMER')
          ? 'Khách hàng'
          : 'Chưa xác định';

  const statusLabel = currentUser?.status === 'ACTIVE'
    ? 'Đang hoạt động'
    : currentUser?.status || 'Chưa có trạng thái';

  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'Chưa có dữ liệu';

  const performLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await backendApi.logout();
    } finally {
      bookingService.clear();
      setIsLoggingOut(false);
      goToLogin();
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      void performLogout();
      return;
    }

    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          void performLogout();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="menu" size={22} color="#005C55" />
        </TouchableOpacity>

        <Text style={styles.brandTitle}>StyleLock</Text>

        <NotificationBellButton navigation={navigation} style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            {currentUser?.avatarUrl ? (
              <Image
                source={{ uri: currentUser.avatarUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={[styles.avatarImg, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AppIcon name="camera" size={15} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{currentUser?.fullName || 'Bạn chưa đăng nhập'}</Text>
          <Text style={styles.userEmail}>
            {currentUser?.email || 'Đăng nhập để đồng bộ hồ sơ'}
          </Text>

          {isLoadingProfile && (
            <View style={styles.profileStatusRow}>
              <ActivityIndicator size="small" color="#005C55" />
              <Text style={styles.profileStatusText}>Đang đồng bộ hồ sơ...</Text>
            </View>
          )}

          {profileError && !isLoadingProfile && (
            <TouchableOpacity style={styles.profileErrorPill} onPress={() => loadProfile()}>
              <Text style={styles.profileErrorText}>{profileError}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.profileInfoGrid}>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>Vai trò</Text>
              <Text style={styles.infoValue}>{roleLabel}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <Text style={styles.infoValue}>{statusLabel}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{currentUser?.phone || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>Ngày tạo</Text>
              <Text style={styles.infoValue}>{memberSince}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={openEditProfileModal}
          >
            <Text style={styles.editProfileText}>{currentUser ? 'Edit Profile' : 'Sign In'}</Text>
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
                <AppIcon name="heart" size={19} color="#005C55" />
              </View>
              <Text style={styles.menuTitle}>Favorite Hairstyles</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#3E4947" />
          </TouchableOpacity>

          {/* Saved Salons */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('SalonList')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="salon" size={19} color="#005C55" />
              </View>
              <Text style={styles.menuTitle}>Saved Salons</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#3E4947" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="bell" size={19} color="#005C55" />
              </View>
              <Text style={styles.menuTitle}>Notifications</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#3E4947" />
          </TouchableOpacity>
        </View>

        {/* Menu Section Group 2 */}
        <View style={styles.menuGroup}>
          {/* Change Password */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() =>
              isAuthenticated
                ? setPasswordModalVisible(true)
                : Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để đổi mật khẩu.')
            }
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="shield" size={19} color="#005C55" />
              </View>
              <Text style={styles.menuTitle}>Change Password</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#3E4947" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={isAuthenticated ? handleLogout : goToLogin}
            disabled={isLoggingOut}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, styles.logoutIconBg]}>
                <AppIcon name={isAuthenticated ? 'logout' : 'user'} size={19} color="#BA1A1A" />
              </View>
              <Text style={styles.logoutTitle}>
                {isAuthenticated ? (isLoggingOut ? 'Logging out...' : 'Logout') : 'Sign In'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            <Text style={styles.modalSub}>
              Cập nhật thông tin cá nhân đang lưu trong backend.
            </Text>

            <Text style={styles.inputLabel}>Họ tên</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nguyen Van A"
              placeholderTextColor="#94A3B8"
              value={profileFullName}
              onChangeText={setProfileFullName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="0988123456"
              placeholderTextColor="#94A3B8"
              value={profilePhone}
              onChangeText={setProfilePhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setEditProfileModalVisible(false)}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.modalSecondaryText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, isUpdatingProfile && styles.modalPrimaryBtnDisabled]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.modalPrimaryText}>
                  {isUpdatingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPasswordModalVisible(false);
          resetPasswordForm();
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <Text style={styles.modalSub}>
              Nhập mật khẩu hiện tại để cập nhật mật khẩu mới cho tài khoản.
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Mật khẩu hiện tại"
              placeholderTextColor="#94A3B8"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Mật khẩu mới"
              placeholderTextColor="#94A3B8"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setPasswordModalVisible(false);
                  resetPasswordForm();
                }}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalSecondaryText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, isChangingPassword && styles.modalPrimaryBtnDisabled]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalPrimaryText}>
                  {isChangingPassword ? 'Đang lưu...' : 'Cập nhật'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar active="Profile" navigation={navigation} />
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
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E7F7F4'
  },
  avatarInitials: {
    color: '#005C55',
    fontSize: 34,
    fontWeight: '800'
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
  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  profileStatusText: {
    fontSize: 13,
    color: '#3E4947',
    fontWeight: '600'
  },
  profileErrorPill: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginBottom: 12
  },
  profileErrorText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  profileInfoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  infoPill: {
    flexGrow: 1,
    flexBasis: '46%',
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEFF'
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '800',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    color: '#121C2A',
    fontWeight: '700'
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 42, 0.36)',
    justifyContent: 'center',
    paddingHorizontal: 22
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E6EEFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#121C2A',
    marginBottom: 6
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    color: '#3E4947',
    fontWeight: '800',
    marginBottom: 6
  },
  passwordInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#121C2A',
    marginBottom: 10
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BDC9C6',
    backgroundColor: '#FFFFFF'
  },
  modalSecondaryText: {
    color: '#3E4947',
    fontSize: 14,
    fontWeight: '800'
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#005C55'
  },
  modalPrimaryBtnDisabled: {
    opacity: 0.7
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
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
