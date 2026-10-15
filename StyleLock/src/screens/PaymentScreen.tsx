import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { AppIcon, IconBadge } from '../components/AppIcon';
import { backendApi } from '../services/backendApi';
import { Booking, Payment } from '../types';
import {
  copyText,
  formatDateTime,
  formatVnd,
  getPaymentStatusMeta,
  getPaymentTypeLabel,
  isAwaitingPayment
} from '../utils/payment';

interface PaymentScreenProps {
  navigation: any;
  route: any;
}

const POLL_INTERVAL_MS = 5000;

type InfoRowProps = {
  label: string;
  value: string;
  copyValue?: string;
  strong?: boolean;
};

const InfoRow: React.FC<InfoRowProps> = ({ label, value, copyValue, strong }) => {
  const handleCopy = async () => {
    const copied = await copyText(copyValue || value);
    if (copied) Alert.alert('Đã sao chép', `${label}: ${copyValue || value}`);
  };

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, strong && styles.infoValueStrong]} selectable>
          {value}
        </Text>
      </View>
      {copyValue !== undefined && (
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.8}>
          <Text style={styles.copyBtnText}>Sao chép</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const bookingId: string | undefined = route.params?.bookingId;
  const paymentId: number | undefined = route.params?.paymentId;

  const [payment, setPayment] = useState<Payment | undefined>();
  const [booking, setBooking] = useState<Booking | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();
  const [qrFailed, setQrFailed] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  const fetchPayment = useCallback(async () => {
    if (bookingId) return backendApi.getBookingPayment(bookingId);
    if (paymentId) return backendApi.getPayment(paymentId);
    throw new Error('Thiếu thông tin thanh toán.');
  }, [bookingId, paymentId]);

  const load = useCallback(async () => {
    if (!backendApi.isAuthenticated()) {
      setLoading(false);
      setError('Vui lòng đăng nhập để xem thông tin thanh toán.');
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const result = await fetchPayment();
      if (!mountedRef.current) return;
      setPayment(result);

      const relatedBookingId = bookingId || (result.bookingId ? String(result.bookingId) : undefined);
      if (relatedBookingId) {
        backendApi
          .getBookingDetail(relatedBookingId)
          .then((detail) => {
            if (mountedRef.current) setBooking(detail);
          })
          .catch(() => undefined);
      }
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : 'Không tải được thanh toán.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [bookingId, fetchPayment]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Tự kiểm tra khi còn chờ thanh toán: webhook SePay sẽ đổi trạng thái sang PAID
  useEffect(() => {
    if (!isAwaitingPayment(payment)) return;

    const timer = setInterval(async () => {
      try {
        const latest = await fetchPayment();
        if (mountedRef.current) setPayment(latest);
      } catch {
        // bỏ qua lỗi mạng tạm thời, lần sau thử lại
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [payment, fetchPayment]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const latest = await fetchPayment();
      setPayment(latest);
      if (latest.status === 'PENDING') {
        Alert.alert('Chưa nhận được tiền', 'Hệ thống chưa ghi nhận giao dịch. Vui lòng đợi ít phút sau khi chuyển khoản.');
      }
    } catch (err) {
      Alert.alert('Không kiểm tra được', err instanceof Error ? err.message : 'Vui lòng thử lại.');
    } finally {
      setChecking(false);
    }
  };

  const goToBooking = () => {
    const targetId = booking?.id || bookingId || (payment?.bookingId ? String(payment.bookingId) : undefined);
    if (targetId) navigation.navigate('BookingStatus', { bookingId: targetId });
  };

  const meta = payment ? getPaymentStatusMeta(payment.status) : undefined;
  const pending = isAwaitingPayment(payment);
  const hasBooking = Boolean(booking || bookingId || payment?.bookingId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrowLeft" size={20} color="#B8895A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && !payment && (
          <View style={styles.centerState}>
            <ActivityIndicator color="#B8895A" />
            <Text style={styles.stateText}>Đang tải thông tin thanh toán...</Text>
          </View>
        )}

        {!loading && error && !payment && (
          <View style={styles.centerState}>
            <IconBadge name="warning" size={22} color="#B65A4B" backgroundColor="#FBE7E1" />
            <Text style={styles.stateText}>{error}</Text>
            {backendApi.isAuthenticated() ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={load} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {payment && meta && (
          <>
            <View style={[styles.statusCard, { backgroundColor: meta.background }]}>
              <IconBadge
                name={payment.status === 'PAID' || payment.status === 'REFUNDED' ? 'check' : payment.status === 'PENDING' || payment.status === 'REFUND_PENDING' ? 'clock' : 'warning'}
                size={22}
                color={meta.color}
                backgroundColor="#FFFFFF"
              />
              <View style={styles.statusCopy}>
                <Text style={[styles.statusTitle, { color: meta.color }]}>{meta.title}</Text>
                <Text style={styles.statusDesc}>{meta.description}</Text>
              </View>
            </View>

            {pending && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Quét mã để thanh toán</Text>
                <Text style={styles.cardSub}>Mở app ngân hàng và quét mã VietQR bên dưới</Text>

                <View style={styles.qrFrame}>
                  {payment.qrUrl && !qrFailed ? (
                    <Image
                      source={{ uri: payment.qrUrl }}
                      style={styles.qrImage}
                      resizeMode="contain"
                      onError={() => setQrFailed(true)}
                    />
                  ) : (
                    <View style={styles.qrFallback}>
                      <AppIcon name="qr" size={40} color="#B8895A" />
                      <Text style={styles.qrFallbackText}>
                        Không hiển thị được mã QR. Hãy chuyển khoản thủ công theo thông tin bên dưới.
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.amountBig}>{formatVnd(payment.amount)}</Text>

                <View style={styles.divider} />

                {payment.bankCode ? <InfoRow label="Ngân hàng" value={payment.bankCode} /> : null}
                {payment.bankAccount ? (
                  <InfoRow label="Số tài khoản" value={payment.bankAccount} copyValue={payment.bankAccount} />
                ) : null}
                <InfoRow label="Số tiền" value={formatVnd(payment.amount)} copyValue={String(Math.round(payment.amount))} />
                <InfoRow
                  label="Nội dung chuyển khoản"
                  value={payment.transferContent || payment.referenceCode}
                  copyValue={payment.transferContent || payment.referenceCode}
                  strong
                />

                <View style={styles.warnBox}>
                  <AppIcon name="info" size={16} color="#8A6A2F" />
                  <Text style={styles.warnText}>
                    Nhập chính xác nội dung chuyển khoản. Sai nội dung hoặc chuyển thiếu tiền, hệ thống sẽ không tự xác nhận được.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, checking && styles.btnDisabled]}
                  onPress={handleCheckNow}
                  disabled={checking}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>{checking ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}</Text>
                </TouchableOpacity>
                <Text style={styles.autoHint}>Tự động kiểm tra mỗi {POLL_INTERVAL_MS / 1000} giây</Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Chi tiết thanh toán</Text>
              <InfoRow label="Loại" value={getPaymentTypeLabel(payment)} />
              {payment.type === 'BOOKING_CONNECTION' && (
                <>
                  <InfoRow label="Tiền dịch vụ" value={formatVnd(payment.serviceAmount)} />
                  <InfoRow label="Phí kết nối StyleLock" value={formatVnd(payment.feeAmount)} />
                </>
              )}
              <InfoRow label="Tổng thanh toán" value={formatVnd(payment.amount)} strong />
              <InfoRow label="Mã tham chiếu" value={payment.referenceCode} copyValue={payment.referenceCode} />
              <InfoRow label="Tạo lúc" value={formatDateTime(payment.createdAt) || '—'} />
              {payment.paidAt ? <InfoRow label="Thanh toán lúc" value={formatDateTime(payment.paidAt)} /> : null}
              {payment.transactionId ? <InfoRow label="Mã giao dịch ngân hàng" value={payment.transactionId} /> : null}
            </View>

            {(payment.status === 'REFUND_PENDING' || payment.status === 'REFUNDED') && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Thông tin hoàn tiền</Text>
                {payment.refundAmount !== undefined ? <InfoRow label="Số tiền hoàn" value={formatVnd(payment.refundAmount)} strong /> : null}
                {payment.refundReason ? <InfoRow label="Lý do" value={payment.refundReason} /> : null}
                {payment.refundRequestedAt ? <InfoRow label="Yêu cầu lúc" value={formatDateTime(payment.refundRequestedAt)} /> : null}
                {payment.refundedAt ? <InfoRow label="Hoàn tiền lúc" value={formatDateTime(payment.refundedAt)} /> : null}
                {payment.refundReference ? <InfoRow label="Mã giao dịch hoàn tiền" value={payment.refundReference} /> : null}
              </View>
            )}

            {booking && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Lịch hẹn liên quan</Text>
                <InfoRow label="Salon" value={booking.salonName} />
                {booking.serviceName ? <InfoRow label="Dịch vụ" value={booking.serviceName} /> : null}
                <InfoRow label="Thời gian" value={`${booking.timeSlot} - ${booking.date}`} />
              </View>
            )}

            {hasBooking && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={goToBooking} activeOpacity={0.85}>
                <Text style={styles.secondaryBtnText}>{pending ? 'Để sau, xem lịch hẹn' : 'Xem lịch hẹn'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('PaymentHistory')} activeOpacity={0.7}>
              <Text style={styles.linkBtnText}>Lịch sử thanh toán</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE6D8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#241F1A' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 14 },
  stateText: { color: '#6F6255', fontSize: 14, textAlign: 'center' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, padding: 16 },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: '900' },
  statusDesc: { color: '#6F6255', fontSize: 13, marginTop: 4, lineHeight: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {}
    })
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#241F1A', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#9B8B7A', marginBottom: 12 },
  qrFrame: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  qrImage: { width: 232, height: 232 },
  qrFallback: { alignItems: 'center', padding: 16, gap: 10 },
  qrFallbackText: { color: '#6F6255', fontSize: 12, textAlign: 'center' },
  amountBig: { fontSize: 26, fontWeight: '900', color: '#B8895A', textAlign: 'center', marginTop: 14 },
  divider: { height: 1, backgroundColor: '#EFE6D8', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: 12 },
  infoCopy: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9B8B7A', fontWeight: '700' },
  infoValue: { fontSize: 14, color: '#241F1A', marginTop: 2 },
  infoValueStrong: { fontWeight: '900', fontSize: 15 },
  copyBtn: { backgroundColor: '#F3E7D8', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  copyBtnText: { color: '#B8895A', fontSize: 12, fontWeight: '800' },
  warnBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F7EBD3',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 14
  },
  warnText: { flex: 1, color: '#8A6A2F', fontSize: 12, lineHeight: 17 },
  primaryBtn: { backgroundColor: '#B8895A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  autoHint: { textAlign: 'center', color: '#9B8B7A', fontSize: 11, marginTop: 8 },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8895A',
    backgroundColor: '#FFFDF9'
  },
  secondaryBtnText: { color: '#B8895A', fontWeight: '900', fontSize: 14 },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkBtnText: { color: '#6F6255', fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' }
});
