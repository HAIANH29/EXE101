import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { AppIcon } from '../components/AppIcon';

interface LoginScreenProps {
  navigation: any;
}

const GOOGLE_CLIENT_ID = '67295940794-03jga5jo7pvhpootvae73u4ap5d20sfj.apps.googleusercontent.com';

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

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleCredentialResponse = async (response: any) => {
        if (response?.credential) {
          try {
            setIsSubmitting(true);
            await backendApi.loginWithGoogle(response.credential);
            Alert.alert('Đăng nhập thành công', 'Đăng nhập với Google thành công!');
            navigation.replace('Home');
          } catch (err: any) {
            Alert.alert('Đăng nhập Google thất bại', err?.message || 'Lỗi xác thực Google token');
          } finally {
            setIsSubmitting(false);
          }
        }
      };

      const initGsi = () => {
        const gsi = (window as any).google?.accounts?.id;
        if (gsi) {
          gsi.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          const container = document.getElementById('google-btn-container');
          if (container) {
            container.innerHTML = '';
            gsi.renderButton(container, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: 280
            });
          }
        }
      };

      if ((window as any).google?.accounts?.id) {
        initGsi();
      } else {
        const existingScript = document.getElementById('google-gsi-script');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'google-gsi-script';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            setTimeout(initGsi, 100);
          };
          document.body.appendChild(script);
        } else {
          existingScript.addEventListener('load', () => setTimeout(initGsi, 100));
        }
      }
    }
  }, []);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và password để đăng nhập backend.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.login(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối backend.';
      Alert.alert('Đăng nhập thất bại', message, [
        { text: 'Thử lại', style: 'cancel' },
        {
          text: 'Dùng phiên Demo',
          onPress: () => {
            authSessionStore.set({
              accessToken: 'demo-token-' + Date.now(),
              refreshToken: 'demo-refresh-token-' + Date.now(),
              tokenType: 'Bearer',
              expiresIn: 86400,
              user: {
                id: 999,
                email: email.trim() || 'demo@stylelock.vn',
                fullName: 'Khách hàng Demo',
                phone: '0901234567',
                status: 'ACTIVE',
                roles: ['ROLE_CUSTOMER']
              }
            });
          }
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // If GSI script loaded and available
      const gsi = (window as any).google?.accounts?.id;
      if (gsi) {
        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response.credential) {
              try {
                setIsSubmitting(true);
                await backendApi.loginWithGoogle(response.credential);
                Alert.alert('Đăng nhập thành công', 'Đăng nhập với Google thành công!');
                navigation.replace('Home');
              } catch (err: any) {
                Alert.alert('Đăng nhập Google thất bại', err?.message || 'Lỗi xác thực Google token');
              } finally {
                setIsSubmitting(false);
              }
            }
          }
        });
        gsi.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to standard Google OAuth redirect
            const redirectUri = window.location.origin;
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20email%20profile&nonce=${Date.now()}`;
            window.location.href = authUrl;
          }
        });
        return;
      }

      // Fallback: Redirect directly to Google OAuth Authorization URL
      const redirectUri = window.location.origin;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20email%20profile&nonce=${Date.now()}`;
      window.location.href = authUrl;
      return;
    }

    authSessionStore.set({
      accessToken: 'google-token-' + Date.now(),
      refreshToken: 'google-refresh-token-' + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: Date.now(),
        email: 'google.user@stylelock.vn',
        fullName: 'Google User',
        status: 'ACTIVE',
        roles: ['ROLE_CUSTOMER']
      }
    });
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Google') {
      handleGoogleLogin();
      return;
    }

    authSessionStore.set({
      accessToken: `${provider.toLowerCase()}-token-` + Date.now(),
      refreshToken: `${provider.toLowerCase()}-refresh-token-` + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: Date.now(),
        email: `user.${provider.toLowerCase()}@stylelock.vn`,
        fullName: `Tài khoản ${provider}`,
        status: 'ACTIVE',
        roles: ['ROLE_CUSTOMER']
      }
    });
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
          {/* Hero Branding Section */}
          <View style={styles.brandingSection}>
            {/* 3D Emerald Spiral Hair Lock Circle */}
            <View style={styles.logoCircle}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300'
                }}
                style={styles.logoImage}
              />
              <View style={styles.logoOverlay}>
                <AppIcon name="scissors" size={34} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.brandTitle}>StyleLock</Text>
            <Text style={styles.brandSubtitle}>
              Your personal AI styling expert. Sign in to access your gallery.
            </Text>
          </View>

          {/* Welcome Back Header */}
          <Text style={styles.welcomeTitle}>Welcome back</Text>

          {/* Login Form Fields */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="hello@example.com"
                placeholderTextColor="#A9A29A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>Password</Text>
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
                  placeholderTextColor="#A9A29A"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <AppIcon name={showPassword ? "eyeOff" : "eye"} size={18} color="#6F6B64" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button with Arrow Icon */}
            <TouchableOpacity
              style={[styles.signInBtn, isSubmitting && styles.signInBtnDisabled]}
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={isSubmitting}
            >
              <View style={styles.signInBtnContent}>
                <AppIcon name="arrowRight" size={18} color="#FFFFFF" />
                <Text style={styles.signInBtnText}>{isSubmitting ? 'Connecting...' : 'Sign In'}</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Side-by-side Social Login Buttons */}
            <View style={styles.socialRow}>
              {/* Google Button */}
              {Platform.OS === 'web' ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <div id="google-btn-container" style={{ width: '100%', minHeight: 48, display: 'flex', justifyContent: 'center' }} />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={() => handleSocialLogin('Google')}
                >
                  <Image source={{ uri: SOCIAL_LOGOS.google }} style={styles.socialLogo} />
                  <Text style={styles.socialBtnText}>Google</Text>
                </TouchableOpacity>
              )}

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
    backgroundColor: '#F7F5F1'
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    minHeight: '100%',
    justifyContent: 'center'
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 20
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#074D44',
    elevation: 4,
    shadowColor: '#074D44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    position: 'relative'
  },
  logoImage: {
    width: '100%',
    height: '100%'
  },
  logoOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(7, 77, 68, 0.45)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#074D44',
    letterSpacing: -0.5,
    marginBottom: 8
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#8A857D',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162524',
    marginBottom: 16,
    marginTop: 4
  },
  formContainer: {
    marginBottom: 24
  },
  fieldGroup: {
    marginBottom: 16
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38342F',
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
    color: '#074D44',
    fontWeight: '700'
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#162524'
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
  signInBtn: {
    height: 52,
    backgroundColor: '#074D44',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#074D44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  signInBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
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
    marginTop: 24,
    marginBottom: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2DFD8'
  },
  dividerText: {
    fontSize: 14,
    color: '#706E6B',
    paddingHorizontal: 16,
    fontWeight: '400'
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32
  },
  socialBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2DFD8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)' }
    })
  },
  socialLogo: {
    width: 22,
    height: 22,
    resizeMode: 'contain'
  },
  appleLogoText: {
    width: 22,
    height: 22,
    color: '#1A2423',
    fontSize: 20,
    lineHeight: 22,
    textAlign: 'center'
  },
  socialBtnText: {
    color: '#1A2423',
    fontSize: 16,
    fontWeight: '600'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  footerText: {
    color: '#6F6C67',
    fontSize: 15
  },
  signUpLink: {
    color: '#074D44',
    fontSize: 15,
    fontWeight: '700'
  }
});
