import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  Platform
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { backendApi } from '../services/backendApi';
import { AppIcon } from '../components/AppIcon';
import { bookingService } from '../services/bookingService';
import { BottomNavBar } from '../components/BottomNavBar';
import { NotificationBellButton } from '../components/NotificationBellButton';
import { AppLanguage, useLanguage } from '../i18n/LanguageContext';

interface ProfileScreenProps {
  navigation: any;
}

const profileCopy = {
  vi: {
    notSignedIn: 'Bạn chưa đăng nhập',
    signInHint: 'Đăng nhập để đồng bộ hồ sơ',
    loadingProfile: 'Đang đồng bộ hồ sơ...',
    profileLoadError: 'Không tải được hồ sơ.',
    signInTitle: 'Cần đăng nhập',
    editProfileRequired: 'Vui lòng đăng nhập trước khi chỉnh sửa hồ sơ.',
    avatarRequired: 'Vui lòng đăng nhập trước khi cập nhật ảnh đại diện.',
    passwordRequired: 'Vui lòng đăng nhập trước khi đổi mật khẩu.',
    paymentHistoryRequired: 'Vui lòng đăng nhập để xem lịch sử thanh toán.',
    missingNameTitle: 'Thiếu họ tên',
    missingNameMessage: 'Họ tên không được để trống.',
    profileUpdatedTitle: 'Đã cập nhật',
    profileUpdatedMessage: 'Hồ sơ của bạn đã được lưu thành công.',
    profileUpdateFailedTitle: 'Cập nhật thất bại',
    profileUpdateFailedMessage: 'Không cập nhật được hồ sơ.',
    photoPermissionTitle: 'Quyền truy cập ảnh',
    photoPermissionMessage: 'Vui lòng cấp quyền truy cập thư viện ảnh để chọn avatar.',
    avatarUpdatedMessage: 'Ảnh đại diện của bạn đã được lưu.',
    avatarUploadFailedTitle: 'Upload thất bại',
    avatarUploadFailedMessage: 'Không upload được ảnh đại diện.',
    missingPasswordTitle: 'Thiếu thông tin',
    missingPasswordMessage: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
    shortPasswordTitle: 'Mật khẩu quá ngắn',
    shortPasswordMessage: 'Mật khẩu mới cần ít nhất 6 ký tự.',
    mismatchPasswordTitle: 'Mật khẩu không khớp',
    mismatchPasswordMessage: 'Vui lòng nhập lại xác nhận mật khẩu mới.',
    passwordUpdatedTitle: 'Đổi mật khẩu thành công',
    passwordUpdatedMessage: 'Mật khẩu tài khoản của bạn đã được cập nhật.',
    passwordUpdateFailedTitle: 'Đổi mật khẩu thất bại',
    passwordUpdateFailedMessage: 'Không đổi được mật khẩu.',
    logoutTitle: 'Đăng xuất',
    logoutConfirmMessage: 'Bạn có chắc chắn muốn đăng xuất?',
    deleteAccountTitle: 'Xóa tài khoản',
    deleteAccountConfirmMessage: 'Bạn có chắc chắn muốn xóa tài khoản? Thao tác này sẽ vô hiệu hóa tài khoản và không thể hoàn tác.',
    deleteAccountSuccess: 'Tài khoản đã được xóa thành công.',
    deleteAccountFailed: 'Không thể xóa tài khoản. Vui lòng thử lại sau.',
    cancel: 'Hủy',
    roles: {
      admin: 'Quản trị viên',
      salonOwner: 'Chủ salon',
      stylist: 'Stylist',
      customer: 'Khách hàng',
      unknown: 'Chưa xác định'
    },
    statusActive: 'Đang hoạt động',
    statusUnknown: 'Chưa có trạng thái',
    noData: 'Chưa có dữ liệu',
    notUpdated: 'Chưa cập nhật',
    roleLabel: 'Vai trò',
    statusLabel: 'Trạng thái',
    phoneLabel: 'Số điện thoại',
    createdAtLabel: 'Ngày tạo',
    editProfile: 'Chỉnh sửa hồ sơ',
    signIn: 'Đăng nhập',
    favoriteHairstyles: 'Kiểu tóc yêu thích',
    savedSalons: 'Salon đã lưu',
    notifications: 'Thông báo',
    paymentHistory: 'Lịch sử thanh toán',
    changePassword: 'Đổi mật khẩu',
    loggingOut: 'Đang đăng xuất...',
    editProfileTitle: 'Chỉnh sửa hồ sơ',
    editProfileSub: 'Cập nhật thông tin cá nhân đang lưu trong backend.',
    fullNameLabel: 'Họ tên',
    phoneInputLabel: 'Số điện thoại',
    saveProfile: 'Lưu hồ sơ',
    saving: 'Đang lưu...',
    passwordTitle: 'Đổi mật khẩu',
    passwordSub: 'Nhập mật khẩu hiện tại để cập nhật mật khẩu mới cho tài khoản.',
    currentPasswordPlaceholder: 'Mật khẩu hiện tại',
    newPasswordPlaceholder: 'Mật khẩu mới',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu mới',
    update: 'Cập nhật',
    navLabels: {
      Home: 'Trang chủ',
      Explore: 'Khám phá',
      AICamera: 'AI Camera',
      Salons: 'Salon',
      Bookings: 'Lịch sử',
      History: 'Lịch sử',
      Profile: 'Cá nhân'
    }
  },
  en: {
    notSignedIn: 'You are not signed in',
    signInHint: 'Sign in to sync your profile',
    loadingProfile: 'Syncing profile...',
    profileLoadError: 'Could not load your profile.',
    signInTitle: 'Sign in required',
    editProfileRequired: 'Please sign in before editing your profile.',
    avatarRequired: 'Please sign in before updating your avatar.',
    passwordRequired: 'Please sign in before changing your password.',
    paymentHistoryRequired: 'Please sign in to view your payment history.',
    missingNameTitle: 'Missing name',
    missingNameMessage: 'Full name cannot be empty.',
    profileUpdatedTitle: 'Profile updated',
    profileUpdatedMessage: 'Your profile has been saved successfully.',
    profileUpdateFailedTitle: 'Update failed',
    profileUpdateFailedMessage: 'Could not update your profile.',
    photoPermissionTitle: 'Photo access',
    photoPermissionMessage: 'Please allow photo library access to choose an avatar.',
    avatarUpdatedMessage: 'Your avatar has been saved.',
    avatarUploadFailedTitle: 'Upload failed',
    avatarUploadFailedMessage: 'Could not upload your avatar.',
    missingPasswordTitle: 'Missing information',
    missingPasswordMessage: 'Please enter your current password and new password.',
    shortPasswordTitle: 'Password too short',
    shortPasswordMessage: 'New password must be at least 6 characters.',
    mismatchPasswordTitle: 'Passwords do not match',
    mismatchPasswordMessage: 'Please re-enter your new password confirmation.',
    passwordUpdatedTitle: 'Password updated',
    passwordUpdatedMessage: 'Your account password has been updated.',
    passwordUpdateFailedTitle: 'Password update failed',
    passwordUpdateFailedMessage: 'Could not change your password.',
    logoutTitle: 'Log out',
    logoutConfirmMessage: 'Are you sure you want to log out?',
    deleteAccountTitle: 'Delete account',
    deleteAccountConfirmMessage: 'Are you sure you want to delete your account? This action cannot be undone.',
    deleteAccountSuccess: 'Account deleted successfully.',
    deleteAccountFailed: 'Could not delete account. Please try again later.',
    cancel: 'Cancel',
    roles: {
      admin: 'Admin',
      salonOwner: 'Salon owner',
      stylist: 'Stylist',
      customer: 'Customer',
      unknown: 'Unknown'
    },
    statusActive: 'Active',
    statusUnknown: 'No status',
    noData: 'No data',
    notUpdated: 'Not updated',
    roleLabel: 'Role',
    statusLabel: 'Status',
    phoneLabel: 'Phone',
    createdAtLabel: 'Joined',
    editProfile: 'Edit profile',
    signIn: 'Sign in',
    favoriteHairstyles: 'Favorite hairstyles',
    savedSalons: 'Saved salons',
    notifications: 'Notifications',
    paymentHistory: 'Payment history',
    changePassword: 'Change password',
    loggingOut: 'Logging out...',
    editProfileTitle: 'Edit profile',
    editProfileSub: 'Update the personal information stored in the backend.',
    fullNameLabel: 'Full name',
    phoneInputLabel: 'Phone number',
    saveProfile: 'Save profile',
    saving: 'Saving...',
    passwordTitle: 'Change password',
    passwordSub: 'Enter your current password to set a new account password.',
    currentPasswordPlaceholder: 'Current password',
    newPasswordPlaceholder: 'New password',
    confirmPasswordPlaceholder: 'Confirm new password',
    update: 'Update',
    navLabels: {
      Home: 'Home',
      Explore: 'Explore',
      AICamera: 'AI Camera',
      Salons: 'Salons',
      Bookings: 'History',
      History: 'History',
      Profile: 'Profile'
    }
  }
} as const;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { language, setLanguage } = useLanguage();
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

  const t = profileCopy[language];
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
          setProfileError(t.notSignedIn);
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
        const message = error instanceof Error ? error.message : t.profileLoadError;
        if (active) setProfileError(message);
      } finally {
        if (active) setIsLoadingProfile(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [t]);

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
      Alert.alert(t.signInTitle, t.editProfileRequired);
      return;
    }

    const fullName = profileFullName.trim();
    if (!fullName) {
      Alert.alert(t.missingNameTitle, t.missingNameMessage);
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
      Alert.alert(t.profileUpdatedTitle, t.profileUpdatedMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.profileUpdateFailedMessage;
      Alert.alert(t.profileUpdateFailedTitle, message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!isAuthenticated) {
      Alert.alert(t.signInTitle, t.avatarRequired);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t.photoPermissionTitle, t.photoPermissionMessage);
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
      Alert.alert(t.profileUpdatedTitle, t.avatarUpdatedMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.avatarUploadFailedMessage;
      Alert.alert(t.avatarUploadFailedTitle, message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isAuthenticated) {
      Alert.alert(t.signInTitle, t.passwordRequired);
      return;
    }

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t.missingPasswordTitle, t.missingPasswordMessage);
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t.shortPasswordTitle, t.shortPasswordMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t.mismatchPasswordTitle, t.mismatchPasswordMessage);
      return;
    }

    try {
      setIsChangingPassword(true);
      await backendApi.changePassword({ oldPassword, newPassword });
      setPasswordModalVisible(false);
      resetPasswordForm();
      Alert.alert(t.passwordUpdatedTitle, t.passwordUpdatedMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.passwordUpdateFailedMessage;
      Alert.alert(t.passwordUpdateFailedTitle, message);
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
    ? t.roles.admin
    : currentUser?.roles?.includes('SALON_OWNER')
      ? t.roles.salonOwner
      : currentUser?.roles?.includes('STYLIST')
        ? t.roles.stylist
        : currentUser?.roles?.includes('CUSTOMER')
          ? t.roles.customer
          : t.roles.unknown;

  const statusLabel = currentUser?.status === 'ACTIVE'
    ? t.statusActive
    : currentUser?.status || t.statusUnknown;

  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : t.noData;

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

    Alert.alert(t.logoutTitle, t.logoutConfirmMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logoutTitle,
        style: 'destructive',
        onPress: () => {
          void performLogout();
        }
      }
    ]);
  };

  const performDeleteAccount = async () => {
    try {
      await backendApi.deleteAccount();
      bookingService.clear();
      Alert.alert(t.deleteAccountTitle, t.deleteAccountSuccess);
      goToLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : t.deleteAccountFailed;
      Alert.alert(t.deleteAccountTitle, message);
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t.deleteAccountConfirmMessage)) {
        void performDeleteAccount();
      }
      return;
    }

    Alert.alert(t.deleteAccountTitle, t.deleteAccountConfirmMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteAccountTitle,
        style: 'destructive',
        onPress: () => {
          void performDeleteAccount();
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topAppBar}>
        <Text style={styles.brandTitle}>StyleLock</Text>

        <View style={styles.headerRightActions}>
          <NotificationBellButton navigation={navigation} style={styles.headerIconBtn} />
          <View style={[styles.headerIconBtn, styles.headerIconBtnActive]}>
            <AppIcon name="user" size={20} color="#B8895A" />
          </View>
        </View>
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

          <Text style={styles.userName}>{currentUser?.fullName || t.notSignedIn}</Text>
          <Text style={styles.userEmail}>
            {currentUser?.email || t.signInHint}
          </Text>

          <View style={styles.languageSwitch}>
            {(['vi', 'en'] as AppLanguage[]).map((option) => {
              const isActive = language === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.languageOption, isActive && styles.languageOptionActive]}
                  onPress={() => setLanguage(option)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                    {option.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isLoadingProfile && (
            <View style={styles.profileStatusRow}>
              <ActivityIndicator size="small" color="#B8895A" />
              <Text style={styles.profileStatusText}>{t.loadingProfile}</Text>
            </View>
          )}

          {profileError && !isLoadingProfile && (
            <TouchableOpacity style={styles.profileErrorPill} onPress={() => loadProfile()}>
              <Text style={styles.profileErrorText}>{profileError}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.profileInfoGrid}>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>{t.roleLabel}</Text>
              <Text style={styles.infoValue}>{roleLabel}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>{t.statusLabel}</Text>
              <Text style={styles.infoValue}>{statusLabel}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>{t.phoneLabel}</Text>
              <Text style={styles.infoValue}>{currentUser?.phone || t.notUpdated}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoLabel}>{t.createdAtLabel}</Text>
              <Text style={styles.infoValue}>{memberSince}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={openEditProfileModal}
          >
            <Text style={styles.editProfileText}>{currentUser ? t.editProfile : t.signIn}</Text>
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
                <AppIcon name="heart" size={19} color="#B8895A" />
              </View>
              <Text style={styles.menuTitle}>{t.favoriteHairstyles}</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#6F6255" />
          </TouchableOpacity>

          {/* Saved Salons */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => navigation.navigate('SalonList')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="salon" size={19} color="#B8895A" />
              </View>
              <Text style={styles.menuTitle}>{t.savedSalons}</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#6F6255" />
          </TouchableOpacity>

          {/* Payment history */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate('PaymentHistory')
                : Alert.alert(t.signInTitle, t.paymentHistoryRequired)
            }
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="card" size={19} color="#B8895A" />
              </View>
              <Text style={styles.menuTitle}>{t.paymentHistory}</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#6F6255" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="bell" size={19} color="#B8895A" />
              </View>
              <Text style={styles.menuTitle}>{t.notifications}</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#6F6255" />
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
                : Alert.alert(t.signInTitle, t.passwordRequired)
            }
          >
            <View style={styles.menuLeft}>
              <View style={styles.menuIconBg}>
                <AppIcon name="shield" size={19} color="#B8895A" />
              </View>
              <Text style={styles.menuTitle}>{t.changePassword}</Text>
            </View>
            <AppIcon name="arrowRight" size={18} color="#6F6255" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={isAuthenticated ? handleLogout : goToLogin}
            disabled={isLoggingOut}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, styles.logoutIconBg]}>
                <AppIcon name={isAuthenticated ? 'logout' : 'user'} size={19} color="#B65A4B" />
              </View>
              <Text style={styles.logoutTitle}>
                {isAuthenticated ? (isLoggingOut ? t.loggingOut : t.logoutTitle) : t.signIn}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Delete Account */}
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5D9CA' }]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIconBg, { backgroundColor: '#FBE7E1' }]}>
                  <AppIcon name="trash" size={19} color="#B65A4B" />
                </View>
                <Text style={[styles.logoutTitle, { color: '#B65A4B' }]}>
                  {t.deleteAccountTitle}
                </Text>
              </View>
            </TouchableOpacity>
          )}
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
            <Text style={styles.modalTitle}>{t.editProfileTitle}</Text>
            <Text style={styles.modalSub}>
              {t.editProfileSub}
            </Text>

            <Text style={styles.inputLabel}>{t.fullNameLabel}</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Nguyen Van A"
              placeholderTextColor="#9B8B7A"
              value={profileFullName}
              onChangeText={setProfileFullName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>{t.phoneInputLabel}</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="0988123456"
              placeholderTextColor="#9B8B7A"
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
                <Text style={styles.modalSecondaryText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, isUpdatingProfile && styles.modalPrimaryBtnDisabled]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                <Text style={styles.modalPrimaryText}>
                  {isUpdatingProfile ? t.saving : t.saveProfile}
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
            <Text style={styles.modalTitle}>{t.passwordTitle}</Text>
            <Text style={styles.modalSub}>
              {t.passwordSub}
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder={t.currentPasswordPlaceholder}
              placeholderTextColor="#9B8B7A"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              placeholder={t.newPasswordPlaceholder}
              placeholderTextColor="#9B8B7A"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.passwordInput}
              placeholder={t.confirmPasswordPlaceholder}
              placeholderTextColor="#9B8B7A"
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
                <Text style={styles.modalSecondaryText}>{t.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, isChangingPassword && styles.modalPrimaryBtnDisabled]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text style={styles.modalPrimaryText}>
                  {isChangingPassword ? t.saving : t.update}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavBar active="Profile" navigation={navigation} labels={t.navLabels} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFE6D8'
  },
  topAppBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 253, 249, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5D9CA',
    zIndex: 10
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7EFE4'
  },
  headerIconBtnActive: {
    backgroundColor: '#F3E7D8'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B8895A',
    letterSpacing: -0.5
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
    backgroundColor: '#F3E7D8'
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E7D8'
  },
  avatarInitials: {
    color: '#B8895A',
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
    backgroundColor: '#B8895A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#241F1A',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#6F6255',
    marginBottom: 16
  },
  languageSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    padding: 3,
    marginBottom: 16
  },
  languageOption: {
    minWidth: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  languageOptionActive: {
    backgroundColor: '#B8895A'
  },
  languageText: {
    color: '#6F6255',
    fontSize: 12,
    fontWeight: '800'
  },
  languageTextActive: {
    color: '#FFFFFF'
  },
  profileStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  profileStatusText: {
    fontSize: 13,
    color: '#6F6255',
    fontWeight: '600'
  },
  profileErrorPill: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F7EFE4',
    borderWidth: 1,
    borderColor: '#F3E7D8',
    marginBottom: 12
  },
  profileErrorText: {
    color: '#B8895A',
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
    borderColor: '#E5D9CA'
  },
  infoLabel: {
    fontSize: 11,
    color: '#6F6255',
    fontWeight: '800',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    color: '#241F1A',
    fontWeight: '700'
  },
  editProfileBtn: {
    backgroundColor: '#B8895A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(221, 203, 181, 0.45)',
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
    borderBottomColor: 'rgba(221, 203, 181, 0.55)'
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
    backgroundColor: 'rgba(221, 203, 181, 0.55)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutIconBg: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)'
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#241F1A'
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B65A4B'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36, 31, 26, 0.38)',
    justifyContent: 'center',
    paddingHorizontal: 22
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F3E7D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#241F1A',
    marginBottom: 6
  },
  modalSub: {
    fontSize: 13,
    color: '#9B8B7A',
    lineHeight: 19,
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    color: '#6F6255',
    fontWeight: '800',
    marginBottom: 6
  },
  passwordInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#241F1A',
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
    borderColor: '#DDCBB5',
    backgroundColor: '#FFFFFF'
  },
  modalSecondaryText: {
    color: '#6F6255',
    fontSize: 14,
    fontWeight: '700'
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B8895A'
  },
  modalPrimaryBtnDisabled: {
    opacity: 0.7
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});

