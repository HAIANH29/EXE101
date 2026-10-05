import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { AppIcon } from '../components/AppIcon';

interface ResetPasswordScreenProps {
  navigation: any;
  route?: {
    params?: {
      token?: string;
      email?: string;
    };
  };
}

function getQueryParam(name: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return '';

  return new URLSearchParams(window.location.search).get(name) || '';
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const initialToken = route?.params?.token || getQueryParam('token');
  const initialEmail = route?.params?.email || getQueryParam('email');

  const [token, setToken] = useState<string>(initialToken);
  const [email] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleResetPassword = async () => {
    if (!token.trim()) {
      Alert.alert('Thiếu mã verify', 'Link reset không có token. Vui lòng mở lại link trong Gmail.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu mới nên có ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Vui lòng nhập lại đúng mật khẩu xác nhận.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.resetPassword({
        token: token.trim(),
        newPassword: password
      });
      Alert.alert('Đổi mật khẩu thành công', 'Bạn có thể đăng nhập bằng mật khẩu mới.', [
        {
          text: 'Sign In',
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            })
        }
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend chưa đổi được mật khẩu.';
      Alert.alert(
        'Chưa đổi được mật khẩu',
        `${message}\n\nVui lòng kiểm tra lại link trong Gmail hoặc yêu cầu gửi link mới.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
              <View style={styles.backRow}><AppIcon name="arrowLeft" size={16} color="#005C55" /><Text style={styles.backText}>Login</Text></View>
            </TouchableOpacity>
          </View>

          <View style={styles.brandingSection}>
            <View style={styles.logoCircle}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=320' }}
                style={styles.logoImage}
              />
              <View style={styles.logoOverlay}>
                <AppIcon name="check" size={32} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.brandTitle}>New Password</Text>
            <Text style={styles.brandSubtitle}>
              {email ? `Resetting password for ${email}` : 'Enter the new password for your StyleLock account.'}
            </Text>
          </View>

          <View style={styles.card}>
            {!initialToken ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>VERIFY TOKEN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Paste token from reset link"
                  placeholderTextColor="#8A9894"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#8A9894"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#8A9894"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleResetPassword}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryBtnText}>{isSubmitting ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F4'
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    minHeight: '100%',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40
  },
  topBar: {
    alignItems: 'flex-start',
    marginBottom: 12
  },
  backBtn: {
    paddingVertical: 8,
    paddingRight: 12
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backText: {
    color: '#005C55',
    fontSize: 14,
    fontWeight: '700'
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 26
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 92, 85, 0.16)',
    backgroundColor: '#FFFFFF'
  },
  logoImage: {
    width: '100%',
    height: '100%'
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 92, 85, 0.25)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoEmoji: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900'
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#005C55',
    marginBottom: 6
  },
  brandSubtitle: {
    maxWidth: 300,
    color: '#687572',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E6E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3
  },
  fieldGroup: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#687572',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    height: 52,
    backgroundColor: '#FBFFFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D0D8D4',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#182C2A'
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    paddingRight: 64
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    paddingVertical: 4,
    paddingHorizontal: 2
  },
  eyeIcon: {
    color: '#005C55',
    fontSize: 12,
    fontWeight: '800'
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#005C55',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  primaryBtnDisabled: {
    opacity: 0.7
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  }
});
