import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon } from './AppIcon';
import { backendApi } from '../services/backendApi';
import { Payment } from '../types';
import { formatVnd, getPaymentStatusMeta, isAwaitingPayment } from '../utils/payment';

type PaymentSummaryCardProps = {
  bookingId: string;
  navigation: any;
};

/** Thẻ tóm tắt thanh toán của một booking, dùng trong màn chi tiết lịch hẹn. */
export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({ bookingId, navigation }) => {
  const [payment, setPayment] = useState<Payment | undefined>();
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async () => {
    if (!backendApi.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setPayment(await backendApi.getBookingPayment(bookingId));
    } catch {
      setPayment(undefined);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  // Quay lại từ màn thanh toán thì cập nhật lại trạng thái
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#B8895A" />
      </View>
    );
  }

  if (!payment) return null;

  const meta = getPaymentStatusMeta(payment.status);
  const pending = isAwaitingPayment(payment);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
          <AppIcon name="card" size={18} color={meta.color} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Thanh toán</Text>
          <Text style={styles.amount}>{formatVnd(payment.amount)}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: meta.background }]}>
          <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      {payment.feeAmount > 0 && (
        <Text style={styles.feeNote}>
          Gồm {formatVnd(payment.serviceAmount)} dịch vụ + {formatVnd(payment.feeAmount)} phí kết nối StyleLock
        </Text>
      )}

      <TouchableOpacity
        style={pending ? styles.primaryBtn : styles.secondaryBtn}
        onPress={() => navigation.navigate('Payment', { bookingId })}
        activeOpacity={0.85}
      >
        <Text style={pending ? styles.primaryBtnText : styles.secondaryBtnText}>
          {pending ? 'Thanh toán ngay' : 'Xem chi tiết thanh toán'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    gap: 12
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 12, color: '#9B8B7A', fontWeight: '700' },
  amount: { fontSize: 18, fontWeight: '900', color: '#241F1A', marginTop: 2 },
  pill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '900' },
  feeNote: { fontSize: 12, color: '#6F6255' },
  primaryBtn: { backgroundColor: '#B8895A', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8895A'
  },
  secondaryBtnText: { color: '#B8895A', fontWeight: '800', fontSize: 13 }
});
