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

const SOCIAL_LOGOS = {
  google: 'https://developers.google.com/identity/images/g-logo.png'
};

const APPLE_LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 1000 1000" aria-hidden="true"><path fill="#1C1C18" d="M747.2 535.7c-.4-86.7 70.8-128.2 74-130.3-40.3-59-103.1-67.1-125.4-68-53.4-5.4-104.2 31.4-131.3 31.4-27 0-68.8-30.6-113.1-29.8-58.2.9-111.9 33.9-141.9 86.1-60.5 105-15.5 260.4 43.5 345.5 28.8 41.6 63.1 88.4 108.2 86.7 43.4-1.7 59.8-28.1 112.4-28.1s67.3 28.1 113.4 27.2c46.8-.9 76.5-42.4 105.1-84.2 33.1-48.4 46.7-95.2 47.5-97.6-1-.5-91.2-35-92.1-138.5zM660.8 281.1c23.9-29 40-69.2 35.6-109.1-34.5 1.4-76.2 23-100.9 52-22.1 25.6-41.5 66.6-36.2 105.9 38.5 3 77.6-19.5 101.5-48.8z"/></svg>';

const appleLogoWebStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  flexShrink: 0
};

const AppleLogo = () => {
  if (Platform.OS === 'web') {
    return React.createElement('span', {
      style: appleLogoWebStyle,
      dangerouslySetInnerHTML: { __html: APPLE_LOGO_SVG }
    });
  }

  return <Text style={styles.appleLogoText}></Text>;
};

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
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
                >
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
                <Image source={{ uri: SOCIAL_LOGOS.google }} style={styles.socialLogo} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              {/* Apple Button */}
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.8}
                onPress={() => handleSocialLogin('Apple')}
              >
                <AppleLogo />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Footer Signup Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp', { email: email.trim() })}
              disabled={isSubmitting}
            >
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
  socialLogo: {
    width: 18,
    height: 18,
    resizeMode: 'contain'
  },
  appleLogoText: {
    width: 18,
    height: 18,
    color: '#1C1C18',
    fontSize: 18,
    lineHeight: 18,
    textAlign: 'center'
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
