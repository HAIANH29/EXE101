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

interface SignUpScreenProps {
  navigation: any;
  route?: {
    params?: {
      email?: string;
    };
  };
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation, route }) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>(route?.params?.email || '');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleCreateAccount = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên, email và mật khẩu.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu nên có ít nhất 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Vui lòng nhập lại đúng mật khẩu xác nhận.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo tài khoản.';
      Alert.alert('Đăng ký thất bại', message);
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
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <View style={styles.backRow}><AppIcon name="arrowLeft" size={16} color="#A97845" /><Text style={styles.backText}>Back</Text></View>
            </TouchableOpacity>
          </View>

          <View style={styles.brandingSection}>
            <View style={styles.logoCircle}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=320' }}
                style={styles.logoImage}
              />
              <View style={styles.logoOverlay}>
                <Text style={styles.logoEmoji}>✦</Text>
              </View>
            </View>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>Save your try-on looks, bookings, and salon history.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Nguyen Van Minh"
                placeholderTextColor="#A99582"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="hello@example.com"
                placeholderTextColor="#A99582"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PHONE</Text>
              <TextInput
                style={styles.input}
                placeholder="0988123456"
                placeholderTextColor="#A99582"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#A99582"
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
                placeholder="Re-enter password"
                placeholderTextColor="#A99582"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleCreateAccount}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryBtnText}>{isSubmitting ? 'Creating...' : 'Create Account'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    backgroundColor: '#F6EFE6'
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
    color: '#A97845',
    fontSize: 14,
    fontWeight: '700'
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 24
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(169, 120, 69, 0.16)',
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
    backgroundColor: 'rgba(169, 120, 69, 0.22)',
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
    color: '#A97845',
    marginBottom: 6
  },
  brandSubtitle: {
    maxWidth: 280,
    textAlign: 'center',
    color: '#6F6256',
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EFE6DA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 22
  },
  fieldGroup: {
    marginBottom: 15
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6F6256',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    height: 52,
    backgroundColor: '#FFFDF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDCDB9',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#2A211C'
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
    color: '#A97845',
    fontSize: 12,
    fontWeight: '800'
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#A97845',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#A97845',
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
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: '#6F6256',
    fontSize: 14
  },
  footerLink: {
    color: '#A97845',
    fontSize: 14,
    fontWeight: '800'
  }
});
