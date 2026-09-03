import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import { bookingService } from '../services/bookingService';
import { MOCK_HAIRSTYLES, MOCK_SALONS } from '../services/mockData';

interface AdminDashboardScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const analytics = bookingService.getAnalytics();

  const totalTryOns = 1420;
  const conversionRate = (
    (analytics.totalBookings / (totalTryOns || 1)) *
    100
  ).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>◀ Về Trang Chủ</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>StyleLock Admin & Analytics</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Pitching Metric Banner */}
        <View style={styles.pitchBanner}>
          <Text style={styles.pitchTitle}>🚀 BÁO CÁO DỰ ÁN (PITCH DECK METRICS)</Text>
          <Text style={styles.pitchSub}>Chỉ số chứng minh hiệu quả conversion funnel O2O</Text>
        </View>

        {/* KPI CARDS GRID */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Try-ons */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>✂️</Text>
            <Text style={styles.kpiValue}>{totalTryOns}</Text>
            <Text style={styles.kpiLabel}>Tổng lượt Thử Tóc (Virtual Try-on)</Text>
          </View>

          {/* Card 2: Total Bookings */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>📅</Text>
            <Text style={styles.kpiValue}>{analytics.totalBookings}</Text>
            <Text style={styles.kpiLabel}>Tổng Yêu Cầu Đặt Lịch (Bookings)</Text>
          </View>

          {/* Card 3: Conversion Rate */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>📈</Text>
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>{conversionRate}%</Text>
            <Text style={styles.kpiLabel}>Tỷ lệ Chuyển đổi (Try ➔ Book)</Text>
          </View>

          {/* Card 4: Confirmed & Completed */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiIcon}>🎉</Text>
            <Text style={[styles.kpiValue, { color: '#38BDF8' }]}>
              {analytics.confirmedBookings + analytics.completedBookings}
            </Text>
            <Text style={styles.kpiLabel}>Đơn Thành Công (Completed)</Text>
          </View>
        </View>

        {/* REVENUE & MONETIZATION METRICS */}
        <View style={styles.revenueCard}>
          <Text style={styles.revTitle}>💰 TỔNG DOANH THU GIAO DỊCH:</Text>
          <Text style={styles.revValue}>
            {analytics.totalRevenue.toLocaleString('vi-VN')} VNĐ
          </Text>

          <View style={styles.divider} />

          <Text style={styles.monetizationLabel}>Mô hình doanh thu StyleLock:</Text>
          <Text style={styles.monetizationItem}>• Phí booking: 2,000 – 5,000 VNĐ / đơn thành công</Text>
          <Text style={styles.monetizationItem}>• Gói Salon Pro: 150,000 VNĐ / tháng / salon</Text>
        </View>

        {/* MANAGEMENT OVERVIEW */}
        <Text style={styles.sectionHeader}>Quản lý dữ liệu hệ thống</Text>
        <View style={styles.mgmtRow}>
          <View style={styles.mgmtCard}>
            <Text style={styles.mgmtNum}>{MOCK_HAIRSTYLES.length}</Text>
            <Text style={styles.mgmtLabel}>Mẫu tóc PNG (20 kiểu)</Text>
          </View>

          <View style={styles.mgmtCard}>
            <Text style={styles.mgmtNum}>{MOCK_SALONS.length}</Text>
            <Text style={styles.mgmtLabel}>Salon đối tác (5 địa điểm)</Text>
          </View>
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
  pitchBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#38BDF8'
  },
  pitchTitle: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4
  },
  pitchSub: {
    color: '#94A3B8',
    fontSize: 11
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  kpiCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center'
  },
  kpiIcon: {
    fontSize: 24,
    marginBottom: 6
  },
  kpiValue: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15
  },
  revenueCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981'
  },
  revTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4
  },
  revValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12
  },
  monetizationLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4
  },
  monetizationItem: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16
  },
  sectionHeader: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10
  },
  mgmtRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  mgmtCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  mgmtNum: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  mgmtLabel: {
    color: '#94A3B8',
    fontSize: 11
  }
});
