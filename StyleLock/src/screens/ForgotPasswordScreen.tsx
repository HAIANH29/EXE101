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
        `${message}\n\nVui lòng kiểm tra backend đang chạy và cấu hình Gmail SMTP nếu muốn gửi mail thật.`
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
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <View style={styles.backRow}><AppIcon name="arrowLeft" size={16} color="#005C55" /><Text style={styles.backText}>Back</Text></View>
            </TouchableOpacity>
          </View>

          <View style={styles.brandingSection}>
            <View style={styles.logoCircle}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=320' }}
                style={styles.logoImage}
              />
              <View style={styles.logoOverlay}>
                <Text style={styles.logoEmoji}>✉</Text>
              </View>
            </View>
            <Text style={styles.brandTitle}>{hasSubmitted ? 'Check Your Gmail' : 'Forgot Password'}</Text>
            <Text style={styles.brandSubtitle}>
              {hasSubmitted
                ? 'Open the verification link from StyleLock to set a new password.'
                : 'Enter the Gmail linked to your StyleLock account.'}
            </Text>
          </View>

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
                    placeholderTextColor="#8A9894"
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
    fontSize: 28,
    fontWeight: '900'
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#005C55',
    marginBottom: 6
  },
  brandSubtitle: {
    maxWidth: 280,
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
    elevation: 3,
    marginBottom: 22
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
  successBox: {
    backgroundColor: '#F2FBF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BDEBDD',
    padding: 16,
    marginBottom: 16
  },
  successTitle: {
    color: '#005C55',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  successText: {
    color: '#687572',
    fontSize: 14
  },
  primaryBtn: {
    height: 52,
    backgroundColor: '#005C55',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerText: {
    color: '#687572',
    fontSize: 14
  },
  footerLink: {
    color: '#005C55',
    fontSize: 14,
    fontWeight: '800'
  }
});
