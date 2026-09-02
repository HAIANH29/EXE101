import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { bookingService } from '../services/bookingService';
import { Booking } from '../types';

interface BookingStatusScreenProps {
  navigation: any;
  route: any;
}

export const BookingStatusScreen: React.FC<BookingStatusScreenProps> = ({ navigation, route }) => {
  const bookingId: string = route.params.bookingId;
  const [booking, setBooking] = useState<Booking | undefined>(
    bookingService.getBookingById(bookingId)
  );

  useEffect(() => {
    // Refresh booking data
    const updated = bookingService.getBookingById(bookingId);
    if (updated) setBooking({ ...updated });
  }, [bookingId]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundCenter}>
          <Text style={styles.notFoundText}>Không tìm thấy thông tin đặt lịch #{bookingId}</Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Quick Demo Simulator: Allow user to simulate Salon approving the booking right away
  const handleSimulateApprove = () => {
    const updated = bookingService.updateBookingStatus(booking.id, 'CONFIRMED');
    if (updated) {
      setBooking({ ...updated });
    }
  };

  const handleSimulateComplete = () => {
    const updated = bookingService.updateBookingStatus(booking.id, 'COMPLETED');
    if (updated) {
      setBooking({ ...updated });
    }
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'PENDING':
        return {
          label: '⏳ ĐANG CHỜ SALON XÁC NHẬN (PENDING)',
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.15)',
          desc: 'Yêu cầu đặt lịch đã được gửi đến Salon. Salon sẽ xác nhận trong vòng 5 phút.'
        };
      case 'CONFIRMED':
        return {
          label: '✅ ĐÃ XÁC NHẬN LỊCH HẸN (CONFIRMED)',
          color: '#10B981',
          bg: 'rgba(16, 185, 129, 0.15)',
          desc: 'Salon đã chấp nhận đặt lịch. Vui lòng đến đúng giờ hẹn để trải nghiệm dịch vụ.'
        };
      case 'COMPLETED':
        return {
          label: '🎉 HOÀN THÀNH DỊCH VỤ (COMPLETED)',
          color: '#38BDF8',
          bg: 'rgba(56, 189, 248, 0.15)',
          desc: 'Dịch vụ đã hoàn tất! Bạn đã được cộng 50 điểm thưởng StyleLock.'
        };
      case 'CANCELLED':
        return {
          label: '❌ ĐÃ HỦY LỊCH HẸN (CANCELLED)',
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          desc: 'Rất tiếc lịch hẹn đã bị hủy do salon bận hoặc khách hàng thay đổi kế hoạch.'
        };
      default:
        return {
          label: booking.status,
          color: '#94A3B8',
          bg: '#1E293B',
          desc: ''
        };
    };
  };

  const statusInfo = getStatusBadge();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>🏠 Trang chủ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết Đặt lịch #{booking.id}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* STATUS BANNER */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color }]}>
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          <Text style={styles.statusDesc}>{statusInfo.desc}</Text>
        </View>

        {/* DEMO SIMULATION SHORTCUT (Allows Instant Testing of Salon Confirm) */}
        {booking.status === 'PENDING' && (
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>⚡ NÚT SIMULATOR (Dành cho Testing & Demo):</Text>
            <TouchableOpacity style={styles.demoBtn} onPress={handleSimulateApprove}>
              <Text style={styles.demoBtnText}>👉 Thao tác giả lập: Salon bấm [CONFIRM]</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'CONFIRMED' && (
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>⚡ NÚT SIMULATOR (Dành cho Testing & Demo):</Text>
            <TouchableOpacity style={[styles.demoBtn, { backgroundColor: '#10B981' }]} onPress={handleSimulateComplete}>
              <Text style={styles.demoBtnText}>👉 Thao tác giả lập: Salon quét QR & Hoàn thành dịch vụ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QR CODE & BOOKING ID VERIFICATION */}
        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>MÃ QR XÁC MINH TẠI SALON</Text>
          <View style={styles.qrPlaceholder}>
            {/* Styled Mock QR Code Matrix */}
            <View style={styles.qrBox}>
              <Text style={styles.qrIcon}>📱</Text>
              <Text style={styles.qrCodeText}>{booking.qrCode || booking.id}</Text>
              <Text style={styles.qrTip}>Đưa mã này cho thu ngân khi đến Salon</Text>
            </View>
          </View>
        </View>

        {/* APPOINTMENT DETAILS */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>📍 Thông tin lịch hẹn</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mã đặt lịch:</Text>
            <Text style={styles.detailValBold}>#{booking.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Salon tiếp nhận:</Text>
            <Text style={styles.detailValBold}>{booking.salonName}</Text>
          </View>
          <Text style={styles.detailSub}>📍 {booking.salonAddress}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Thời gian làm tóc:</Text>
            <Text style={styles.detailHighlight}>
              🕒 {booking.timeSlot} - Ngày {booking.date}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Dịch vụ chọn:</Text>
            <Text style={styles.detailVal}>{booking.serviceName || 'Cắt tạo kiểu'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Khách hàng:</Text>
            <Text style={styles.detailVal}>{booking.customerName} ({booking.customerPhone})</Text>
          </View>

          {booking.totalPrice && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tổng chi phí dịch vụ:</Text>
              <Text style={styles.detailPrice}>{booking.totalPrice.toLocaleString('vi-VN')} đ</Text>
            </View>
          )}
        </View>

        {/* ATTACHED TRY-ON HAIRSTYLE PREVIEW */}
        {booking.hairstyleName && (
          <View style={styles.hairstylePreviewCard}>
            <Text style={styles.previewCardTitle}>✂️ Mẫu tóc Try-On đã ghép:</Text>
            <View style={styles.previewRow}>
              <Image source={{ uri: booking.tryOnImageUrl }} style={styles.previewImg} />
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{booking.hairstyleName}</Text>
                <Text style={styles.previewDesc}>
                  Thợ cắt sẽ căn cứ vào ảnh Try-on này để tạo hình đúng sở thích của bạn.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('BookingHistory')}
          >
            <Text style={styles.historyBtnText}>📅 Lịch sử đặt lịch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeBtnText}>🏠 Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  scrollContent: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6
  },
  statusDesc: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18
  },
  demoBox: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)'
  },
  demoTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6
  },
  demoBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center'
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  qrCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  qrTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5
  },
  qrPlaceholder: {
    width: '100%',
    alignItems: 'center'
  },
  qrBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
    width: '85%'
  },
  qrIcon: {
    fontSize: 36,
    marginBottom: 6
  },
  qrCodeText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4
  },
  qrTip: {
    color: '#94A3B8',
    fontSize: 11
  },
  detailsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  detailsTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 13
  },
  detailVal: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600'
  },
  detailValBold: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800'
  },
  detailSub: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 6
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 8
  },
  detailHighlight: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '700'
  },
  detailPrice: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800'
  },
  hairstylePreviewCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0EA5E9'
  },
  previewCardTitle: {
    color: '#0EA5E9',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  previewImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#334155'
  },
  previewInfo: {
    flex: 1
  },
  previewName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  previewDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24
  },
  historyBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  historyBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700'
  },
  homeBtn: {
    flex: 1,
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  notFoundCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  notFoundText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16
  }
});
