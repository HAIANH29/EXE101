import React, { useState } from 'react';
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
import { Booking, BookingStatus } from '../types';

interface BookingHistoryScreenProps {
  navigation: any;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'CONFIRMED' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' }
];

export const BookingHistoryScreen: React.FC<BookingHistoryScreenProps> = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const allBookings = bookingService.getAllBookings();

  const filteredBookings = allBookings.filter((b) => {
    if (selectedFilter === 'ALL') return true;
    return b.status === selectedFilter;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'PENDING', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)' };
      case 'CONFIRMED':
        return { label: 'CONFIRMED', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' };
      case 'COMPLETED':
        return { label: 'COMPLETED', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.2)' };
      case 'CANCELLED':
        return { label: 'CANCELLED', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.2)' };
      default:
        return { label: status, color: '#94A3B8', bg: '#334155' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>◀ Trở về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử Đặt lịch & Booking Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Loyalty Points Banner */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyLeft}>
            <Text style={styles.loyaltyPoints}>🌟 150 Điểm StyleLock</Text>
            <Text style={styles.loyaltySub}>Tích 500 điểm nhận ngay 1 lần cắt tóc miễn phí!</Text>
          </View>
          <View style={styles.loyaltyBadge}>
            <Text style={styles.loyaltyBadgeText}>Thành viên Vàng</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterPill, selectedFilter === f.value && styles.activePill]}
              onPress={() => setSelectedFilter(f.value)}
            >
              <Text style={[styles.filterText, selectedFilter === f.value && styles.activeFilterText]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>Chưa có lịch hẹn nào ở trạng thái này</Text>
            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => navigation.navigate('HairstyleSelect')}
            >
              <Text style={styles.bookNowText}>Thử tóc & Đặt lịch ngay ✂️</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const badge = getStatusBadge(b.status);
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.bookingItem}
                onPress={() => navigation.navigate('BookingStatus', { bookingId: b.id })}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.bookingId}>Mã: #{b.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemBody}>
                  {b.tryOnImageUrl && (
                    <Image source={{ uri: b.tryOnImageUrl }} style={styles.itemThumb} />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.salonName} numberOfLines={1}>
                      {b.salonName}
                    </Text>
                    {b.hairstyleName && (
                      <Text style={styles.hairName}>✂️ Kiểu tóc: {b.hairstyleName}</Text>
                    )}
                    <Text style={styles.serviceName}>💇 Service: {b.serviceName || 'Cắt tóc'}</Text>
                    <Text style={styles.dateTime}>
                      🕒 {b.timeSlot} - Ngày {b.date}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <Text style={styles.createdDate}>Tạo lúc: {b.createdAt}</Text>
                  {b.totalPrice && (
                    <Text style={styles.totalPrice}>
                      {b.totalPrice.toLocaleString('vi-VN')} đ
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  loyaltyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  loyaltyLeft: {
    flex: 1
  },
  loyaltyPoints: {
    color: '#FBBF24',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2
  },
  loyaltySub: {
    color: '#94A3B8',
    fontSize: 11
  },
  loyaltyBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  loyaltyBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700'
  },
  filterScroll: {
    marginBottom: 16,
    maxHeight: 40
  },
  filterContent: {
    gap: 8
  },
  filterPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  activePill: {
    backgroundColor: '#0EA5E9',
    borderColor: '#38BDF8'
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 30,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center'
  },
  bookNowBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  bookNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  bookingItem: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  bookingId: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  itemBody: {
    flexDirection: 'row',
    marginBottom: 10
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#334155'
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  salonName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  hairName: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600'
  },
  serviceName: {
    color: '#CBD5E1',
    fontSize: 11
  },
  dateTime: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8
  },
  createdDate: {
    color: '#64748B',
    fontSize: 10
  },
  totalPrice: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800'
  }
});
