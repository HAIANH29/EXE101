import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LocalizedText as Text, LocalizedTextInput as TextInput, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { AppIcon } from '../components/AppIcon';
import { BrandLogo } from '../components/BrandLogo';

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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối backend.';
      Alert.alert('Đăng nhập thất bại', message);
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
          {/* Hero Branding Section */}
          <View style={styles.brandingSection}>
            <BrandLogo containerStyle={styles.logoCircle} imageStyle={styles.logoImage} />

            <Text style={styles.brandSubtitle}>
              Your personal AI styling expert. Sign in to access your gallery.
            </Text>
          </View>

          <View style={styles.bodySection}>
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
                  placeholderTextColor="#9B8B7A"
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
                    placeholderTextColor="#9B8B7A"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <AppIcon name={showPassword ? "eyeOff" : "eye"} size={18} color="#6F6255" />
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollContent: {
    minHeight: '100%',
    backgroundColor: '#FFFFFF'
  },
  brandingSection: {
    alignItems: 'center',
    backgroundColor: '#EFE6D8',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#E5D9CA'
  },
  bodySection: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 40
  },
  logoCircle: {
    width: 166,
    height: 104,
    marginBottom: 10
  },
  logoImage: {
    width: '100%',
    height: '100%'
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#9B8B7A',
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#241F1A',
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
    color: '#3A2D24',
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
    color: '#6B4227',
    fontWeight: '700'
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#241F1A'
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
    backgroundColor: '#6B4227',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#6B4227',
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16
  },
  footerText: {
    color: '#6F6255',
    fontSize: 15
  },
  signUpLink: {
    color: '#6B4227',
    fontSize: 15,
    fontWeight: '700'
  }
});

