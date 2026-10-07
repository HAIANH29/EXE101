import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { bookingService } from '../services/bookingService';
import { MOCK_HAIRSTYLES, MOCK_SALONS } from '../services/mockData';
import { AppIcon, IconBadge } from '../components/AppIcon';

interface AdminDashboardScreenProps {
  navigation: any;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ navigation }) => {
  const analytics = bookingService.getAnalytics();

  const totalTryOns = 1420;
  const conversionRate = (
    (analytics.totalBookings / (totalTryOns || 1)) *
    100
  ).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <View style={styles.backRow}>
              <AppIcon name="arrowLeft" size={16} color="#B8895A" />
              <Text style={styles.backBtnText}>Trang chủ</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản trị & Phân tích</Text>
          <View style={styles.headerRightBadge}>
            <Text style={styles.headerRightBadgeText}>PRO</Text>
          </View>
        </View>

        {/* Pitch Deck Metrics Banner */}
        <View style={styles.pitchBanner}>
          <View style={styles.pitchHeaderRow}>
            <IconBadge name="trendingUp" size={16} containerStyle={styles.pitchIconBadge} />
            <Text style={styles.pitchTitle}>PITCH DECK METRICS</Text>
            <View style={styles.funnelBadge}>
              <Text style={styles.funnelBadgeText}>O2O Funnel</Text>
            </View>
          </View>
          <Text style={styles.pitchSub}>Chỉ số đo lường hiệu quả chuyển đổi từ Virtual Try-On đến Salon Booking</Text>
        </View>

        {/* 2-COLUMN COMPACT KPI GRID */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Try-ons */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <IconBadge name="scissors" size={18} containerStyle={styles.kpiIconBadge} />
              <Text style={styles.kpiTrendTag}>+18.4%</Text>
            </View>
            <Text style={styles.kpiValue}>{totalTryOns.toLocaleString('vi-VN')}</Text>
            <Text style={styles.kpiLabel}>Lượt thử tóc AI (Virtual Try-on)</Text>
          </View>

          {/* Card 2: Total Bookings */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <IconBadge name="calendar" size={18} containerStyle={[styles.kpiIconBadge, { backgroundColor: '#F3E7D8' }]} />
              <Text style={[styles.kpiTrendTag, { color: '#B8895A', backgroundColor: '#F7EFE4' }]}>O2O</Text>
            </View>
            <Text style={styles.kpiValue}>{analytics.totalBookings}</Text>
            <Text style={styles.kpiLabel}>Yêu cầu đặt lịch (Bookings)</Text>
          </View>

          {/* Card 3: Conversion Rate */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <IconBadge name="trendingUp" size={18} containerStyle={[styles.kpiIconBadge, { backgroundColor: '#F3E7D8' }]} />
              <Text style={[styles.kpiTrendTag, { color: '#7C6E3F', backgroundColor: '#F4EAD8' }]}>CR</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#7C6E3F' }]}>{conversionRate}%</Text>
            <Text style={styles.kpiLabel}>Tỷ lệ chuyển đổi (Try ➔ Book)</Text>
          </View>

          {/* Card 4: Confirmed & Completed */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardTop}>
              <IconBadge name="check" size={18} containerStyle={[styles.kpiIconBadge, { backgroundColor: '#F7EFE4' }]} />
              <Text style={[styles.kpiTrendTag, { color: '#B8895A', backgroundColor: '#F7EFE4' }]}>Success</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#B8895A' }]}>
              {analytics.confirmedBookings + analytics.completedBookings}
            </Text>
            <Text style={styles.kpiLabel}>Đơn đặt lịch thành công</Text>
          </View>
        </View>

        {/* REVENUE & MONETIZATION SECTION */}
        <View style={styles.revenueCard}>
          <View style={styles.revHeaderRow}>
            <View style={styles.revLeftHeader}>
              <IconBadge name="money" size={18} containerStyle={styles.revIconBadge} />
              <Text style={styles.revTitle}>Tổng doanh thu giao dịch</Text>
            </View>
            <Text style={styles.revStatusPill}>Giai đoạn 1</Text>
          </View>

          <Text style={styles.revValue}>
            {analytics.totalRevenue.toLocaleString('vi-VN')} <Text style={styles.currencySymbol}>VNĐ</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.monetizationTitle}>Mô hình doanh thu StyleLock O2O:</Text>
          <View style={styles.monetizationList}>
            <View style={styles.monetizationRow}>
              <View style={styles.dotPill} />
              <Text style={styles.monetizationText}>
                <Text style={styles.boldText}>Phí Booking:</Text> 2,000 – 5,000 VNĐ / đơn hoàn tất
              </Text>
            </View>
            <View style={styles.monetizationRow}>
              <View style={styles.dotPill} />
              <Text style={styles.monetizationText}>
                <Text style={styles.boldText}>Gói Salon Pro:</Text> 150,000 VNĐ / tháng / salon đối tác
              </Text>
            </View>
          </View>
        </View>

        {/* SYSTEM OVERVIEW CARDS */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Dữ liệu hệ thống</Text>
          <Text style={styles.sectionHeaderSub}>Dữ liệu hoạt động 24/7</Text>
        </View>
        <View style={styles.mgmtRow}>
          <View style={styles.mgmtCard}>
            <View style={styles.mgmtIconRow}>
              <AppIcon name="scissors" size={16} color="#B8895A" />
              <Text style={styles.mgmtNum}>{MOCK_HAIRSTYLES.length}</Text>
            </View>
            <Text style={styles.mgmtLabel}>Mẫu tóc AI PNG Catalog</Text>
          </View>

          <View style={styles.mgmtCard}>
            <View style={styles.mgmtIconRow}>
              <AppIcon name="calendar" size={16} color="#8A7748" />
              <Text style={styles.mgmtNum}>{MOCK_SALONS.length}</Text>
            </View>
            <Text style={styles.mgmtLabel}>Salon đối tác hoạt động</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFE6D8'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backBtnText: {
    color: '#B8895A',
    fontSize: 12,
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#241F1A'
  },
  headerRightBadge: {
    backgroundColor: '#241F1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  headerRightBadgeText: {
    color: '#D8B98E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  pitchBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#241F1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(36, 31, 26, 0.05)' }
    })
  },
  pitchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  pitchIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F7EFE4'
  },
  pitchTitle: {
    color: '#B8895A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  funnelBadge: {
    marginLeft: 'auto',
    backgroundColor: '#F3E7D8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  funnelBadgeText: {
    color: '#6F6255',
    fontSize: 10,
    fontWeight: '700'
  },
  pitchSub: {
    color: '#6F6255',
    fontSize: 12,
    lineHeight: 16
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#241F1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(36, 31, 26, 0.05)' }
    })
  },
  kpiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  kpiIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F7EFE4'
  },
  kpiTrendTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C6E3F',
    backgroundColor: '#F4EAD8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden'
  },
  kpiValue: {
    color: '#241F1A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  kpiLabel: {
    color: '#6F6255',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15
  },
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#241F1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(36, 31, 26, 0.05)' }
    })
  },
  revHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  revLeftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  revIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3E7D8'
  },
  revTitle: {
    color: '#241F1A',
    fontSize: 13,
    fontWeight: '700'
  },
  revStatusPill: {
    backgroundColor: '#F3E7D8',
    color: '#6F6255',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden'
  },
  revValue: {
    color: '#241F1A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9B8B7A'
  },
  divider: {
    height: 1,
    backgroundColor: '#F3E7D8',
    marginVertical: 12
  },
  monetizationTitle: {
    color: '#241F1A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8
  },
  monetizationList: {
    gap: 6
  },
  monetizationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  dotPill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B8895A'
  },
  monetizationText: {
    color: '#6F6255',
    fontSize: 11,
    lineHeight: 16
  },
  boldText: {
    color: '#241F1A',
    fontWeight: '700'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  sectionHeader: {
    color: '#241F1A',
    fontSize: 14,
    fontWeight: '800'
  },
  sectionHeaderSub: {
    color: '#9B8B7A',
    fontSize: 11
  },
  mgmtRow: {
    flexDirection: 'row',
    gap: 12
  },
  mgmtCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5D9CA',
    ...Platform.select({
      ios: { shadowColor: '#241F1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
      web: { boxShadow: '0 2px 6px rgba(36, 31, 26, 0.04)' }
    })
  },
  mgmtIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  mgmtNum: {
    color: '#241F1A',
    fontSize: 18,
    fontWeight: '800'
  },
  mgmtLabel: {
    color: '#6F6255',
    fontSize: 11,
    fontWeight: '500'
  }
});


