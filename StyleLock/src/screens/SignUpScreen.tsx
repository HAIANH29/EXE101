import React, { useState } from 'react';
import {
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
import { BrandLogo } from '../components/BrandLogo';

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
  const [otp, setOtp] = useState<string>('');
  const [otpEmail, setOtpEmail] = useState<string>('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const normalizedEmail = email.trim().toLowerCase();

  const validateAccountForm = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên, email và mật khẩu.');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu nên có ít nhất 8 ký tự.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu chưa khớp', 'Vui lòng nhập lại đúng mật khẩu xác nhận.');
      return false;
    }

    return true;
  };

  const handleSendOtp = async () => {
    if (!validateAccountForm()) return;

    try {
      setIsSubmitting(true);
      await backendApi.sendRegisterOtp({ email: normalizedEmail });
      setOtp('');
      setOtpEmail(normalizedEmail);
      setStep('otp');
      Alert.alert('Đã gửi OTP', `Vui lòng kiểm tra email ${normalizedEmail} để lấy mã xác thực.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi mã OTP.';
      Alert.alert('Gửi OTP thất bại', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndCreateAccount = async () => {
    if (!validateAccountForm()) return;

    if (!otp.trim()) {
      Alert.alert('Thiếu OTP', 'Vui lòng nhập mã OTP đã được gửi đến email của bạn.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.verifyRegisterOtp({
        email: otpEmail || normalizedEmail,
        otp: otp.trim()
      });
      await backendApi.register({
        fullName: fullName.trim(),
        email: otpEmail || normalizedEmail,
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

  const handleEditDetails = () => {
    setStep('details');
    setOtp('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
                <View style={styles.backRow}><AppIcon name="arrowLeft" size={16} color="#B8895A" /><Text style={styles.backText}>Back</Text></View>
              </TouchableOpacity>
            </View>

            <View style={styles.brandingSection}>
              <BrandLogo containerStyle={styles.logoCircle} imageStyle={styles.logoImage} />
              <Text style={styles.brandTitle}>Create Account</Text>
              <Text style={styles.brandSubtitle}>Save your try-on looks, bookings, and salon history.</Text>
            </View>
          </View>

          <View style={styles.bodySection}>
            <View style={styles.card}>
              {step === 'details' ? (
                <View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>FULL NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nguyen Van Minh"
                      placeholderTextColor="#9B8B7A"
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
                      placeholderTextColor="#9B8B7A"
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
                      placeholderTextColor="#9B8B7A"
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
                        placeholderTextColor="#9B8B7A"
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
                      placeholderTextColor="#9B8B7A"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handleSendOtp}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.primaryBtnText}>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.otpBox}>
                    <Text style={styles.otpTitle}>OTP sent</Text>
                    <Text style={styles.otpText}>{otpEmail}</Text>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>OTP CODE</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor="#9B8B7A"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      maxLength={6}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handleVerifyAndCreateAccount}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.otpActions}>
                    <TouchableOpacity onPress={handleSendOtp} disabled={isSubmitting}>
                      <Text style={[styles.actionLink, isSubmitting && styles.actionLinkDisabled]}>Resend OTP</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleEditDetails} disabled={isSubmitting}>
                      <Text style={[styles.actionLink, isSubmitting && styles.actionLinkDisabled]}>Edit details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
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
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    minHeight: '100%',
    backgroundColor: '#FFFFFF'
  },
  headerSection: {
    backgroundColor: '#EFE6D8',
    paddingHorizontal: 24,
    paddingTop: 22,
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
    color: '#B8895A',
    fontSize: 14,
    fontWeight: '700'
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 0
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
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#B8895A',
    marginBottom: 6
  },
  brandSubtitle: {
    maxWidth: 280,
    textAlign: 'center',
    color: '#6F6255',
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5D9CA',
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
    color: '#6F6255',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  input: {
    height: 52,
    backgroundColor: '#FFFDF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDCBB5',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#241F1A'
  },
  otpBox: {
    backgroundColor: '#F7EFE4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8B98E',
    padding: 16,
    marginBottom: 16
  },
  otpTitle: {
    color: '#B8895A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  otpText: {
    color: '#6F6255',
    fontSize: 14
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4
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
    color: '#B8895A',
    fontSize: 12,
    fontWeight: '800'
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#B8895A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#B8895A',
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
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  actionLink: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '800'
  },
  actionLinkDisabled: {
    opacity: 0.5
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: '#6F6255',
    fontSize: 14
  },
  footerLink: {
    color: '#B8895A',
    fontSize: 14,
    fontWeight: '800'
  }
});

