import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { backendApi } from '../services/backendApi';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và password để đăng nhập backend.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.login(email.trim(), password);
      navigation.replace('Home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối backend.';
      Alert.alert('Không đăng nhập được backend', message, [
        { text: 'Ở lại', style: 'cancel' },
        { text: 'Vào demo', onPress: () => navigation.replace('Home') }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Đăng nhập ' + provider, 'Đang đăng nhập qua ' + provider + '...', [
      { text: 'OK', onPress: () => navigation.replace('Home') }
    ]);
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Đăng ký backend', 'Nhập email và password trước, rồi bấm Sign Up.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.register({
        email: email.trim(),
        password,
        fullName: email.split('@')[0] || 'StyleLock User'
      });
      navigation.replace('Home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể đăng ký backend.';
      Alert.alert('Đăng ký thất bại', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Skip / Back option */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.replace('Home')} style={styles.skipBtn}>
              <Text style={styles.skipText}>Bỏ qua ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Branding Section */}
          <View style={styles.brandingSection}>
            {/* 3D Pearlescent Hair Lock Avatar Placeholder */}
            <View style={styles.logoCircle}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300'
                }}
                style={styles.logoImage}
              />
              <View style={styles.logoOverlay}>
                <Text style={styles.logoEmoji}>✂️</Text>
              </View>
            </View>

            <Text style={styles.brandTitle}>StyleLock</Text>
            <Text style={styles.brandSubtitle}>
              Your personal AI styling expert. Sign in to access your gallery.
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.card}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="hello@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity onPress={() => Alert.alert('Quên mật khẩu', 'Vui lòng kiểm tra email khôi phục!')}>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.passwordInputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInBtn, isSubmitting && styles.signInBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={isSubmitting}
            >
              <Text style={styles.signInBtnText}>{isSubmitting ? 'Connecting...' : 'Sign In'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialGroup}>
              {/* Google Button */}
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.8}
                onPress={() => handleSocialLogin('Google')}
              >
                <Text style={styles.socialIcon}>🌐</Text>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              {/* Apple Button */}
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.8}
                onPress={() => handleSocialLogin('Apple')}
              >
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Footer Signup Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={isSubmitting}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
    backgroundColor: '#FAFAFA'
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: '100%',
    justifyContent: 'center'
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: 10
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  skipText: {
    color: '#005C55',
    fontSize: 13,
    fontWeight: '600'
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 28
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 92, 85, 0.15)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'relative'
  },
  logoImage: {
    width: '100%',
    height: '100%'
  },
  logoOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 92, 85, 0.25)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoEmoji: {
    fontSize: 34
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#005C55',
    letterSpacing: -0.5,
    marginBottom: 6
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24
  },
  fieldGroup: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  forgotLink: {
    fontSize: 13,
    color: '#005C55',
    fontWeight: '600'
  },
  input: {
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#121C2A'
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4
  },
  eyeIcon: {
    fontSize: 18
  },
  signInBtn: {
    height: 52,
    backgroundColor: '#005C55',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#005C55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  signInBtnDisabled: {
    opacity: 0.7
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6'
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 12,
    letterSpacing: 0.5
  },
  socialGroup: {
    gap: 10
  },
  socialBtn: {
    height: 52,
    backgroundColor: '#E6E2DC',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8
  },
  socialIcon: {
    fontSize: 18
  },
  socialBtnText: {
    color: '#1C1C18',
    fontSize: 14,
    fontWeight: '600'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: '#475569',
    fontSize: 14
  },
  signUpLink: {
    color: '#005C55',
    fontSize: 14,
    fontWeight: '800'
  }
});
