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

interface ForgotPasswordScreenProps {
  navigation: any;
  route?: {
    params?: {
      email?: string;
    };
  };
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState<string>(route?.params?.email || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  const handleSendResetMail = async () => {
    if (!email.trim()) {
      Alert.alert('Thiếu email', 'Vui lòng nhập email của tài khoản cần khôi phục.');
      return;
    }

    try {
      setIsSubmitting(true);
      await backendApi.requestPasswordReset({
        email: email.trim().toLowerCase()
      });
      setHasSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Backend chưa gửi được email khôi phục.';
      Alert.alert(
        'Chưa gửi được email',
        `${message}\n\nVui lòng thử lại sau hoặc liên hệ hỗ trợ nếu lỗi vẫn tiếp diễn.`
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
          <View style={styles.headerSection}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
                <View style={styles.backRow}><AppIcon name="arrowLeft" size={16} color="#B8895A" /><Text style={styles.backText}>Back</Text></View>
              </TouchableOpacity>
            </View>

            <View style={styles.brandingSection}>
              <BrandLogo containerStyle={styles.logoCircle} imageStyle={styles.logoImage} />
              <Text style={styles.brandTitle}>{hasSubmitted ? 'Check Your Gmail' : 'Forgot Password'}</Text>
              <Text style={styles.brandSubtitle}>
                {hasSubmitted
                  ? 'Open the verification link from StyleLock to set a new password.'
                  : 'Enter the Gmail linked to your StyleLock account.'}
              </Text>
            </View>
          </View>

          <View style={styles.bodySection}>
            <View style={styles.card}>
              {hasSubmitted ? (
                <View>
                  <View style={styles.successBox}>
                    <Text style={styles.successTitle}>Email sent</Text>
                    <Text style={styles.successText}>{email.trim()}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.primaryBtnText}>Back to Login</Text>
                  </TouchableOpacity>

                </View>
              ) : (
                <View>
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

                  <TouchableOpacity
                    style={[styles.primaryBtn, isSubmitting && styles.primaryBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={handleSendResetMail}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.primaryBtnText}>{isSubmitting ? 'Sending...' : 'Send Verification Email'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Remember your password? </Text>
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
    color: '#6F6255',
    textAlign: 'center',
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
    marginBottom: 16
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
  successBox: {
    backgroundColor: '#F7EFE4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8B98E',
    padding: 16,
    marginBottom: 16
  },
  successTitle: {
    color: '#B8895A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  successText: {
    color: '#6F6255',
    fontSize: 14
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#B8895A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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

