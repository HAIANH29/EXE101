import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { bookingService } from '../services/bookingService';
import { MOCK_SALONS } from '../services/mockData';
import { Booking, BookingStatus } from '../types';
import { AppIcon, IconBadge } from '../components/AppIcon';

interface SalonDashboardScreenProps {
  navigation: any;
}

export const SalonDashboardScreen: React.FC<SalonDashboardScreenProps> = ({ navigation }) => {
  const [selectedSalonId, setSelectedSalonId] = useState<string>(MOCK_SALONS[0].id);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  const salonBookings = bookingService.getBookingsBySalon(selectedSalonId);
  const currentSalon = MOCK_SALONS.find((s) => s.id === selectedSalonId) || MOCK_SALONS[0];

  const filteredBookings = salonBookings.filter((b) => {
    if (statusFilter === 'ALL') return true;
    return b.status === statusFilter;
  });

  const handleUpdateStatus = (bookingId: string, newStatus: BookingStatus) => {
    const updated = bookingService.updateBookingStatus(bookingId, newStatus);
    if (updated) {
      // Trigger re-render by updating dummy state or state change
      Alert.alert(
        'Cập nhật thành công',
        `Lịch hẹn #${bookingId} đã chuyển sang trạng thái [${newStatus}]`
      );
      setStatusFilter(newStatus);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}><AppIcon name="arrowLeft" size={15} color="#005C55" /><Text style={styles.backBtnText}>Về App Khách</Text></View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salon Merchant Dashboard</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Salon Selector Pill */}
        <Text style={styles.sectionLabel}>Đang quản lý với tư cách Salon đối tác:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salonSelectorScroll}>
          {MOCK_SALONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.salonPill, selectedSalonId === s.id && styles.activeSalonPill]}
              onPress={() => setSelectedSalonId(s.id)}
            >
              <Text style={[styles.salonPillText, selectedSalonId === s.id && styles.activeSalonPillText]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* DOUBLE BOOKING PROTECTION BANNER */}
        <View style={styles.protectionCard}>
          <View style={styles.protectionTitleRow}><IconBadge name="shield" size={17} containerStyle={styles.protectionIconBadge} /><Text style={styles.protectionTitle}>Cơ chế Double-Booking Protection:</Text></View>
          <Text style={styles.protectionText}>
            Vui lòng kiểm tra thợ & ghế trống tại Salon trước khi bấm <Text style={{ fontWeight: '800', color: '#7C8A55' }}>[CONFIRM]</Text>. Khách hàng đang chờ phản hồi xác nhận.
          </Text>
        </View>

        {/* STATUS FILTER TABS */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'PENDING' && styles.activePendingTab]}
            onPress={() => setStatusFilter('PENDING')}
          >
            <Text style={[styles.filterTabText, statusFilter === 'PENDING' && styles.activeTabText]}>
              Chờ duyệt ({salonBookings.filter((b) => b.status === 'PENDING').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'CONFIRMED' && styles.activeConfirmedTab]}
            onPress={() => setStatusFilter('CONFIRMED')}
          >
            <Text style={[styles.filterTabText, statusFilter === 'CONFIRMED' && styles.activeTabText]}>
              Đã duyệt ({salonBookings.filter((b) => b.status === 'CONFIRMED').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, statusFilter === 'COMPLETED' && styles.activeCompletedTab]}
            onPress={() => setStatusFilter('COMPLETED')}
          >
            <Text style={[styles.filterTabText, statusFilter === 'COMPLETED' && styles.activeTabText]}>
              Hoàn tất ({salonBookings.filter((b) => b.status === 'COMPLETED').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOOKING REQUEST CARDS */}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyCard}>
            <IconBadge name="calendar" size={24} containerStyle={styles.emptyIconBadge} />
            <Text style={styles.emptyText}>Không có lịch hẹn nào ở mục [{statusFilter}]</Text>
          </View>
        ) : (
          filteredBookings.map((b) => (
            <View key={b.id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>Mã phiếu: #{b.id}</Text>
                </View>
                <Text style={styles.cardTime}>Tạo lúc: {b.createdAt}</Text>
              </View>

              {/* Customer & Appointment Info */}
              <View style={styles.cardMain}>
                <View style={styles.customerBox}>
                  <Text style={styles.custName}>Khách hàng: {b.customerName}</Text>
                  <Text style={styles.custPhone}>SĐT: {b.customerPhone}</Text>
                  <Text style={styles.appointmentTime}>
                    Khung giờ hẹn: <Text style={styles.timeHighlight}>{b.timeSlot} ngày {b.date}</Text>
                  </Text>
                  <Text style={styles.serviceText}>Dịch vụ chọn: {b.serviceName || 'Cắt tạo kiểu'}</Text>
                  {b.totalPrice && (
                    <Text style={styles.priceText}>
                      Tổng thu: {b.totalPrice.toLocaleString('vi-VN')} đ
                    </Text>
                  )}
                </View>

                {/* Try-on Thumbnail */}
                {b.tryOnImageUrl && (
                  <View style={styles.tryOnBox}>
                    <Image source={{ uri: b.tryOnImageUrl }} style={styles.tryOnImg} />
                    <Text style={styles.tryOnTag} numberOfLines={1}>
                      {b.hairstyleName || 'Try-on Photo'}
                    </Text>
                  </View>
                )}
              </View>

              {/* MERCHANT ACTIONS */}
              <View style={styles.actionRow}>
                {b.status === 'PENDING' && (
                  <>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleUpdateStatus(b.id, 'CANCELLED')}
                    >
                      <Text style={styles.cancelBtnText}>HỦY LỊCH</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                    >
                      <Text style={styles.confirmBtnText}>DUYỆT GIỮ CHỖ</Text>
                    </TouchableOpacity>
                  </>
                )}

                {b.status === 'CONFIRMED' && (
                  <>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleUpdateStatus(b.id, 'CANCELLED')}
                    >
                      <Text style={styles.cancelBtnText}>Khách No-show</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.completeBtn}
                      onPress={() => handleUpdateStatus(b.id, 'COMPLETED')}
                    >
                      <Text style={styles.completeBtnText}>XÁC NHẬN THANH TOÁN</Text>
                    </TouchableOpacity>
                  </>
                )}

                {b.status === 'COMPLETED' && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>Đã hoàn tất & Đã thu tiền</Text>
                  </View>
                )}

                {b.status === 'CANCELLED' && (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledBadgeText}>Đã hủy yêu cầu đặt lịch này</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F4'
  },
  scrollContent: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  backBtn: {
    paddingVertical: 4
  },
  backBtnText: {
    color: '#005C55',
    fontSize: 13,
    fontWeight: '600'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#182C2A'
  },
  sectionLabel: {
    color: '#8A9894',
    fontSize: 12,
    marginBottom: 6
  },
  salonSelectorScroll: {
    marginBottom: 14
  },
  salonPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D0D8D4'
  },
  activeSalonPill: {
    backgroundColor: '#005C55',
    borderColor: '#B7D3C6'
  },
  salonPillText: {
    color: '#8A9894',
    fontSize: 12,
    fontWeight: '600'
  },
  activeSalonPillText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  protectionCard: {
    backgroundColor: '#EFF6F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6F8B7A'
  },
  protectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4
  },
  protectionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  protectionTitle: {
    color: '#005C55',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2
  },
  protectionText: {
    color: '#074D44',
    fontSize: 11,
    lineHeight: 16
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14
  },
  filterTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D8D4'
  },
  activePendingTab: {
    backgroundColor: '#005C55',
    borderColor: '#B7D3C6'
  },
  activeConfirmedTab: {
    backgroundColor: '#005C55',
    borderColor: '#CCD8B6'
  },
  activeCompletedTab: {
    backgroundColor: '#005C55',
    borderColor: '#6F8B7A'
  },
  filterTabText: {
    color: '#8A9894',
    fontSize: 11,
    fontWeight: '700'
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D8D4'
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyIconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 10
  },
  emptyText: {
    color: '#8A9894',
    fontSize: 13
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D0D8D4'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  badgePending: {
    backgroundColor: '#DDEBE3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgePendingText: {
    color: '#005C55',
    fontSize: 11,
    fontWeight: '700'
  },
  cardTime: {
    color: '#8A9894',
    fontSize: 11
  },
  cardMain: {
    flexDirection: 'row',
    marginBottom: 12
  },
  customerBox: {
    flex: 1
  },
  custName: {
    color: '#182C2A',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  custPhone: {
    color: '#005C55',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4
  },
  appointmentTime: {
    color: '#687572',
    fontSize: 12,
    marginBottom: 2
  },
  timeHighlight: {
    color: '#005C55',
    fontWeight: '800'
  },
  serviceText: {
    color: '#8A9894',
    fontSize: 12,
    marginBottom: 2
  },
  priceText: {
    color: '#7C8A55',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  tryOnBox: {
    width: 70,
    alignItems: 'center',
    marginLeft: 10
  },
  tryOnImg: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: '#DDEBE3',
    marginBottom: 4
  },
  tryOnTag: {
    color: '#005C55',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#687572',
    paddingTop: 10
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(182, 90, 75, 0.18)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9A195'
  },
  cancelBtnText: {
    color: '#B65A4B',
    fontSize: 12,
    fontWeight: '800'
  },
  confirmBtn: {
    flex: 1.5,
    backgroundColor: '#005C55',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  completeBtn: {
    flex: 1.5,
    backgroundColor: '#005C55',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  completedBadge: {
    flex: 1,
    backgroundColor: 'rgba(0, 92, 85, 0.14)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  completedBadgeText: {
    color: '#005C55',
    fontSize: 12,
    fontWeight: '700'
  },
  cancelledBadge: {
    flex: 1,
    backgroundColor: 'rgba(182, 90, 75, 0.14)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelledBadgeText: {
    color: '#B65A4B',
    fontSize: 12,
    fontWeight: '700'
  }
});
