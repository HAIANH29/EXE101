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
import { AppIcon, IconBadge } from '../components/AppIcon';

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
            <View style={styles.backRow}><AppIcon name="arrowLeft" size={15} color="#0F766E" /><Text style={styles.backBtnText}>Về Trang Chủ</Text></View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>StyleLock Admin & Analytics</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Pitching Metric Banner */}
        <View style={styles.pitchBanner}>
          <View style={styles.pitchTitleRow}><IconBadge name="trendingUp" size={18} containerStyle={styles.pitchIconBadge} /><Text style={styles.pitchTitle}>BÁO CÁO DỰ ÁN (PITCH DECK METRICS)</Text></View>
          <Text style={styles.pitchSub}>Chỉ số chứng minh hiệu quả conversion funnel O2O</Text>
        </View>

        {/* KPI CARDS GRID */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Try-ons */}
          <View style={styles.kpiCard}>
            <IconBadge name="scissors" size={22} containerStyle={styles.kpiIconBadge} />
            <Text style={styles.kpiValue}>{totalTryOns}</Text>
            <Text style={styles.kpiLabel}>Tổng lượt Thử Tóc (Virtual Try-on)</Text>
          </View>

          {/* Card 2: Total Bookings */}
          <View style={styles.kpiCard}>
            <IconBadge name="calendar" size={22} containerStyle={styles.kpiIconBadge} />
            <Text style={styles.kpiValue}>{analytics.totalBookings}</Text>
            <Text style={styles.kpiLabel}>Tổng Yêu Cầu Đặt Lịch (Bookings)</Text>
          </View>

          {/* Card 3: Conversion Rate */}
          <View style={styles.kpiCard}>
            <IconBadge name="trendingUp" size={22} containerStyle={styles.kpiIconBadge} />
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>{conversionRate}%</Text>
            <Text style={styles.kpiLabel}>Tỷ lệ Chuyển đổi (Try ➔ Book)</Text>
          </View>

          {/* Card 4: Confirmed & Completed */}
          <View style={styles.kpiCard}>
            <IconBadge name="check" size={22} containerStyle={styles.kpiIconBadge} />
            <Text style={[styles.kpiValue, { color: '#0F766E' }]}>
              {analytics.confirmedBookings + analytics.completedBookings}
            </Text>
            <Text style={styles.kpiLabel}>Đơn Thành Công (Completed)</Text>
          </View>
        </View>

        {/* REVENUE & MONETIZATION METRICS */}
        <View style={styles.revenueCard}>
          <View style={styles.revTitleRow}><IconBadge name="money" size={18} containerStyle={styles.revIconBadge} /><Text style={styles.revTitle}>TỔNG DOANH THU GIAO DỊCH:</Text></View>
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
    backgroundColor: '#F6F8F7'
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
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '600'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A'
  },
  pitchBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDE7E3'
  },
  pitchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4
  },
  pitchIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  pitchTitle: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4
  },
  pitchSub: {
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDE7E3',
    alignItems: 'center'
  },
  kpiIcon: {
    fontSize: 24,
    marginBottom: 6
  },
  kpiIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8
  },
  kpiValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  revTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6
  },
  revIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  revTitle: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4
  },
  revValue: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800'
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12
  },
  monetizationLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4
  },
  monetizationItem: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16
  },
  sectionHeader: {
    color: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDE7E3'
  },
  mgmtNum: {
    color: '#0F766E',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  mgmtLabel: {
    color: '#64748B',
    fontSize: 11
  }
});
