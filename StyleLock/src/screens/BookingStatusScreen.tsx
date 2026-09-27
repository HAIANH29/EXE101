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
import { backendApi } from '../services/backendApi';
import { bookingService } from '../services/bookingService';
import { Booking, BookingStatus } from '../types';
import { AppIcon, AppIconName } from '../components/AppIcon';

interface BookingStatusScreenProps {
  navigation: any;
  route: any;
}

type LineIconName =
  | 'home'
  | 'success'
  | 'pending'
  | 'complete'
  | 'cancelled'
  | 'service'
  | 'qr'
  | 'pin'
  | 'calendar'
  | 'user'
  | 'wallet'
  | 'hair'
  | 'history'
  | 'arrow';

type IconSize = 'sm' | 'md' | 'lg';

type StatusVisual = {
  title: string;
  code: BookingStatus | string;
  icon: LineIconName;
  color: string;
  bg: string;
  border: string;
  desc: string;
};

const LINE_ICON_MAP: Record<LineIconName, AppIconName> = {
  home: 'home',
  success: 'check',
  pending: 'clock',
  complete: 'star',
  cancelled: 'close',
  service: 'scissors',
  qr: 'qr',
  pin: 'pin',
  calendar: 'calendar',
  user: 'user',
  wallet: 'money',
  hair: 'scissors',
  history: 'refresh',
  arrow: 'arrowRight'
};

const QR_CELLS = [
  1, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 1, 0,
  1, 1, 1, 1, 0, 1, 1,
  0, 0, 1, 0, 1, 0, 0,
  1, 0, 0, 1, 1, 1, 0,
  0, 1, 1, 0, 0, 1, 1,
  1, 0, 1, 1, 0, 0, 1
];

const IconBadge = ({
  name,
  color = '#0F766E',
  bg = '#E7F7F4',
  size = 'md'
}: {
  name: LineIconName;
  color?: string;
  bg?: string;
  size?: IconSize;
}) => (
  <View
    style={[
      styles.iconBadge,
      size === 'sm' && styles.iconBadgeSm,
      size === 'lg' && styles.iconBadgeLg,
      { backgroundColor: bg, borderColor: color }
    ]}
  >
    <AppIcon
      name={LINE_ICON_MAP[name]}
      size={size === 'sm' ? 13 : size === 'lg' ? 24 : 17}
      color={color}
    />
  </View>
);

const DetailRow = ({
  icon,
  label,
  value,
  accent,
  strong
}: {
  icon: LineIconName;
  label: string;
  value: string;
  accent?: string;
  strong?: boolean;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelGroup}>
      <IconBadge name={icon} size="sm" color={accent || '#0F766E'} bg="#F0FDF9" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={[styles.detailValue, strong && styles.detailValueStrong, accent ? { color: accent } : undefined]}>
      {value}
    </Text>
  </View>
);

function getStatusVisual(status: BookingStatus): StatusVisual {
  switch (status) {
    case 'PENDING':
      return {
        title: 'Đang chờ salon xác nhận',
        code: 'PENDING',
        icon: 'pending',
        color: '#B45309',
        bg: '#FFF7ED',
        border: '#FDBA74',
        desc: 'Yêu cầu đặt lịch đã được gửi đến salon. Salon sẽ xác nhận trong vòng vài phút.'
      };
    case 'CONFIRMED':
      return {
        title: 'Đã xác nhận lịch hẹn',
        code: 'CONFIRMED',
        icon: 'success',
        color: '#047857',
        bg: '#ECFDF5',
        border: '#6EE7B7',
        desc: 'Salon đã chấp nhận đặt lịch. Vui lòng đến đúng giờ hẹn để trải nghiệm dịch vụ.'
      };
    case 'IN_SERVICE':
      return {
        title: 'Đang phục vụ tại salon',
        code: 'IN_SERVICE',
        icon: 'service',
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#93C5FD',
        desc: 'Lịch hẹn đang được thực hiện. Bạn có thể theo dõi trạng thái hoàn tất tại đây.'
      };
    case 'COMPLETED':
      return {
        title: 'Dịch vụ đã hoàn thành',
        code: 'COMPLETED',
        icon: 'complete',
        color: '#0369A1',
        bg: '#F0F9FF',
        border: '#7DD3FC',
        desc: 'Dịch vụ đã hoàn tất. Cảm ơn bạn đã sử dụng StyleLock.'
      };
    case 'CANCELLED':
      return {
        title: 'Lịch hẹn đã bị hủy',
        code: 'CANCELLED',
        icon: 'cancelled',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        desc: 'Lịch hẹn đã bị hủy do salon bận hoặc do khách hàng thay đổi kế hoạch.'
      };
    default:
      return {
        title: status,
        code: status,
        icon: 'service',
        color: '#475569',
        bg: '#F8FAFC',
        border: '#CBD5E1',
        desc: ''
      };
  }
}

export const BookingStatusScreen: React.FC<BookingStatusScreenProps> = ({ navigation, route }) => {
  const bookingId: string = route.params.bookingId;
  const [booking, setBooking] = useState<Booking | undefined>(
    bookingService.getBookingById(bookingId)
  );

  useEffect(() => {
    let isMounted = true;

    const loadBooking = async () => {
      const updated = bookingService.getBookingById(bookingId);
      if (updated) {
        setBooking({ ...updated });
      }

      if (!backendApi.isAuthenticated()) return;

      try {
        const backendBooking = await backendApi.getBookingDetail(bookingId);
        const merged = bookingService.upsertBooking(backendBooking);
        if (isMounted) setBooking({ ...merged });
      } catch {
        // Keep not-found state when backend detail is unavailable.
      }
    };

    loadBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundCenter}>
          <IconBadge name="cancelled" size="lg" color="#DC2626" bg="#FEF2F2" />
          <Text style={styles.notFoundText}>Không tìm thấy thông tin đặt lịch #{bookingId}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.primaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  const statusInfo = getStatusVisual(booking.status);
  const hasPrice = typeof booking.totalPrice === 'number';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeLink}>
            <IconBadge name="home" size="sm" color="#0F766E" bg="#E7F7F4" />
            <Text style={styles.homeLinkText}>Trang chủ</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>Chi tiết đặt lịch</Text>
            <Text style={styles.headerTitle}>#{booking.id}</Text>
          </View>

          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>{statusInfo.code}</Text>
          </View>
        </View>

        <View style={[styles.statusCard, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
          <IconBadge name={statusInfo.icon} size="lg" color={statusInfo.color} bg="#FFFFFF" />
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>{statusInfo.title}</Text>
            <Text style={styles.statusDesc}>{statusInfo.desc}</Text>
          </View>
        </View>

        {booking.status === 'PENDING' && !booking.apiId && (
          <View style={styles.demoBox}>
            <View style={styles.demoHeader}>
              <IconBadge name="arrow" size="sm" color="#2563EB" bg="#EFF6FF" />
              <Text style={styles.demoTitle}>Simulator cho demo</Text>
            </View>
            <TouchableOpacity style={styles.demoBtn} onPress={handleSimulateApprove}>
              <Text style={styles.demoBtnText}>Giả lập salon xác nhận lịch hẹn</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'CONFIRMED' && !booking.apiId && (
          <View style={styles.demoBox}>
            <View style={styles.demoHeader}>
              <IconBadge name="arrow" size="sm" color="#047857" bg="#ECFDF5" />
              <Text style={styles.demoTitle}>Simulator cho demo</Text>
            </View>
            <TouchableOpacity style={[styles.demoBtn, styles.demoBtnSuccess]} onPress={handleSimulateComplete}>
              <Text style={styles.demoBtnText}>Giả lập quét mã và hoàn thành dịch vụ</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.qrCard}>
          <View style={styles.sectionHeader}>
            <IconBadge name="qr" color="#0F766E" bg="#E7F7F4" />
            <View>
              <Text style={styles.sectionTitle}>Mã xác minh tại salon</Text>
              <Text style={styles.sectionSub}>Đưa mã này cho thu ngân khi đến salon</Text>
            </View>
          </View>

          <View style={styles.qrPanel}>
            <View style={styles.qrMatrix}>
              {QR_CELLS.map((filled, index) => (
                <View key={`${index}-${filled}`} style={[styles.qrCell, filled ? styles.qrCellFilled : undefined]} />
              ))}
            </View>
            <View style={styles.qrCodeGroup}>
              <Text style={styles.qrLabel}>Mã booking</Text>
              <Text style={styles.qrCodeText}>{booking.qrCode || `STYLELOCK-${booking.id}`}</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <IconBadge name="pin" color="#0F766E" bg="#E7F7F4" />
            <View>
              <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>
              <Text style={styles.sectionSub}>Các thông tin salon cần để phục vụ bạn</Text>
            </View>
          </View>

          <View style={styles.detailList}>
            <DetailRow icon="qr" label="Mã đặt lịch" value={`#${booking.id}`} strong />
            <DetailRow icon="home" label="Salon tiếp nhận" value={booking.salonName} strong />
            <View style={styles.addressBox}>
              <IconBadge name="pin" size="sm" color="#64748B" bg="#F8FAFC" />
              <Text style={styles.addressText}>{booking.salonAddress}</Text>
            </View>
            <View style={styles.divider} />
            <DetailRow
              icon="calendar"
              label="Thời gian làm tóc"
              value={`${booking.timeSlot} - Ngày ${booking.date}`}
              accent="#B45309"
              strong
            />
            <DetailRow icon="service" label="Dịch vụ chọn" value={booking.serviceName || 'Cắt tạo kiểu'} />
            <DetailRow icon="user" label="Khách hàng" value={`${booking.customerName} (${booking.customerPhone})`} />
            {hasPrice && (
              <DetailRow
                icon="wallet"
                label="Tổng chi phí dịch vụ"
                value={`${booking.totalPrice?.toLocaleString('vi-VN')} đ`}
                accent="#0F766E"
                strong
              />
            )}
          </View>
        </View>

        {booking.hairstyleName && (
          <View style={styles.hairstylePreviewCard}>
            <View style={styles.sectionHeader}>
              <IconBadge name="hair" color="#2563EB" bg="#EFF6FF" />
              <View>
                <Text style={styles.sectionTitle}>Mẫu tóc Try-On đã chọn</Text>
                <Text style={styles.sectionSub}>Salon sẽ dùng ảnh này làm tham chiếu tạo kiểu</Text>
              </View>
            </View>

            <View style={styles.previewRow}>
              {booking.tryOnImageUrl ? (
                <Image source={{ uri: booking.tryOnImageUrl }} style={styles.previewImg} />
              ) : (
                <View style={styles.previewImgPlaceholder}>
                  <Text style={styles.previewPlaceholderText}>SL</Text>
                </View>
              )}
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{booking.hairstyleName}</Text>
                <Text style={styles.previewDesc}>
                  Thợ cắt sẽ căn cứ vào ảnh Try-On này để tạo hình đúng sở thích của bạn.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('BookingHistory')}
          >
            <IconBadge name="history" size="sm" color="#0F766E" bg="#FFFFFF" />
            <Text style={styles.secondaryButtonText}>Lịch sử đặt lịch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <IconBadge name="home" size="sm" color="#FFFFFF" bg="rgba(255,255,255,0.18)" />
            <Text style={styles.primaryButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F7'
  },
  scrollContent: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12
  },
  homeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE7E3'
  },
  homeLinkText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '700'
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1
  },
  headerEyebrow: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2
  },
  headerPill: {
    minWidth: 82,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#0F766E'
  },
  headerPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900'
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2
  },
  iconBadgeSm: {
    width: 26,
    height: 26,
    borderRadius: 13
  },
  iconBadgeLg: {
    width: 46,
    height: 46,
    borderRadius: 23
  },
  iconGlyph: {
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 19
  },
  iconGlyphSm: {
    fontSize: 13,
    lineHeight: 15
  },
  iconGlyphLg: {
    fontSize: 24,
    lineHeight: 26
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5
  },
  statusCopy: {
    flex: 1
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 5
  },
  statusDesc: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19
  },
  demoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8E2FF'
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  demoTitle: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '900'
  },
  demoBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  demoBtnSuccess: {
    backgroundColor: '#0F766E'
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDE7E3',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900'
  },
  sectionSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1
  },
  qrPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  qrMatrix: {
    width: 98,
    height: 98,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  qrCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#E2E8F0'
  },
  qrCellFilled: {
    backgroundColor: '#0F766E'
  },
  qrCodeGroup: {
    flex: 1,
    minWidth: 180
  },
  qrLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6
  },
  qrCodeText: {
    color: '#0F766E',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDE7E3',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2
  },
  detailList: {
    gap: 10
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 6
  },
  detailLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minWidth: 170
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700'
  },
  detailValue: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1
  },
  detailValueStrong: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900'
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  addressText: {
    flex: 1,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2
  },
  hairstylePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  previewImg: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#E2E8F0'
  },
  previewImgPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  previewPlaceholderText: {
    color: '#2563EB',
    fontSize: 18,
    fontWeight: '900'
  },
  previewInfo: {
    flex: 1
  },
  previewName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  previewDesc: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: '#0F766E',
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DDE7E3'
  },
  secondaryButtonText: {
    color: '#0F766E',
    fontSize: 14,
    fontWeight: '900'
  },
  notFoundCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 14
  },
  notFoundText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center'
  }
});