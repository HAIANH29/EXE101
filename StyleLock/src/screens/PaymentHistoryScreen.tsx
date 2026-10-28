import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { LocalizedText as Text } from '../i18n/LocalizedComponents';
import { AppIcon, IconBadge } from '../components/AppIcon';
import { backendApi } from '../services/backendApi';
import { Payment, PaymentStatus } from '../types';
import { formatDateTime, formatVnd, getPaymentStatusMeta, getPaymentTypeLabel } from '../utils/payment';

interface PaymentHistoryScreenProps {
  navigation: any;
}

const PAGE_SIZE = 20;

type Filter = 'ALL' | 'PENDING' | 'PAID' | 'REFUND';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'REFUND', label: 'Hoàn tiền' }
];

function matchesFilter(status: PaymentStatus, filter: Filter) {
  if (filter === 'ALL') return true;
  if (filter === 'REFUND') return status === 'REFUND_PENDING' || status === 'REFUNDED';
  return status === filter;
}

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ navigation }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>();

  const totalPaidAmount = useMemo(() => {
    return payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const paidCount = useMemo(() => {
    return payments.filter((p) => p.status === 'PAID').length;
  }, [payments]);

  const pendingCount = useMemo(() => {
    return payments.filter((p) => p.status === 'PENDING').length;
  }, [payments]);

  const load = useCallback(async (silent = false) => {
    if (!backendApi.isAuthenticated()) {
      setLoading(false);
      setError('Vui lòng đăng nhập để xem lịch sử thanh toán.');
      return;
    }

    if (!silent) setLoading(true);
    setError(undefined);
    try {
      const result = await backendApi.getPaymentHistory(0, PAGE_SIZE);
      setPayments(result.items);
      setHasMore(result.hasMore);
      setPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lịch sử thanh toán.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await backendApi.getPaymentHistory(page + 1, PAGE_SIZE);
      setPayments((current) => [...current, ...result.items]);
      setHasMore(result.hasMore);
      setPage((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải thêm được.');
    } finally {
      setLoadingMore(false);
    }
  };

  const visible = payments.filter((payment) => matchesFilter(payment.status, filter));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="arrowLeft" size={20} color="#B8895A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = filter === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor="#B8895A"
          />
        }
      >
        {/* Financial Overview Card */}
        {!loading && !error && payments.length > 0 && (
          <View style={styles.paymentSummaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryIconBox}>
                <AppIcon name="card" size={20} color="#B8895A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summarySubtitle}>Tổng chi tiêu đã thanh toán</Text>
                <Text style={styles.summaryAmount}>{formatVnd(totalPaidAmount)}</Text>
              </View>
              <TouchableOpacity
                style={styles.summaryRefreshBtn}
                onPress={() => load(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="refresh" size={15} color="#8D7B68" />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryMetricsRow}>
              <View style={styles.summaryMetricItem}>
                <Text style={styles.summaryMetricValue}>{payments.length}</Text>
                <Text style={styles.summaryMetricLabel}>Tổng giao dịch</Text>
              </View>
              <View style={styles.summaryMetricDivider} />
              <View style={styles.summaryMetricItem}>
                <Text style={[styles.summaryMetricValue, { color: '#2E7D32' }]}>{paidCount}</Text>
                <Text style={styles.summaryMetricLabel}>Thành công</Text>
              </View>
              <View style={styles.summaryMetricDivider} />
              <View style={styles.summaryMetricItem}>
                <Text style={[styles.summaryMetricValue, pendingCount > 0 && { color: '#D97706' }]}>
                  {pendingCount}
                </Text>
                <Text style={styles.summaryMetricLabel}>Chờ thanh toán</Text>
              </View>
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator color="#B8895A" size="small" />
            <Text style={styles.stateText}>Đang tải lịch sử thanh toán...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.centerState}>
            <IconBadge name="warning" size={22} color="#B65A4B" backgroundColor="#FBE7E1" />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => (backendApi.isAuthenticated() ? load() : navigation.navigate('Login'))}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{backendApi.isAuthenticated() ? 'Thử lại' : 'Đăng nhập'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && visible.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBadge}>
              <AppIcon name="card" size={28} color="#B8895A" />
            </View>
            <Text style={styles.emptyTitle}>
              {payments.length === 0 ? 'Bạn chưa có giao dịch nào' : 'Không có giao dịch ở mục này'}
            </Text>
            <Text style={styles.emptySub}>
              {payments.length === 0
                ? 'Các giao dịch đặt cọc giữ chỗ và hóa đơn dịch vụ làm tóc sẽ xuất hiện tại đây sau khi thực hiện.'
                : 'Vui lòng chọn bộ lọc khác hoặc kiểm tra lại sau.'}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('SalonList')}
              activeOpacity={0.85}
            >
              <AppIcon name="scissors" size={16} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>Khám phá salon & Đặt lịch ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading &&
          visible.map((payment) => {
            const meta = getPaymentStatusMeta(payment.status);
            const isPending = payment.status === 'PENDING';
            const isPaid = payment.status === 'PAID';

            return (
              <TouchableOpacity
                key={payment.id}
                style={styles.card}
                onPress={() => navigation.navigate('Payment', { paymentId: payment.id })}
                activeOpacity={0.88}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.paymentIconBox, isPaid && styles.paymentIconBoxPaid]}>
                      <AppIcon
                        name={isPaid ? 'check' : isPending ? 'clock' : 'card'}
                        size={18}
                        color={isPaid ? '#2E7D32' : isPending ? '#D97706' : '#B8895A'}
                      />
                    </View>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle}>{getPaymentTypeLabel(payment)}</Text>
                      <Text style={styles.cardSub}>
                        {payment.bookingId ? `Lịch hẹn #${payment.bookingId} · ` : ''}
                        Mã: {payment.referenceCode}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.pill, { backgroundColor: meta.background }]}>
                    <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardBottom}>
                  <View style={styles.dateRow}>
                    <AppIcon name="clock" size={13} color="#9B8B7A" />
                    <Text style={styles.cardDate}>{formatDateTime(payment.paidAt || payment.createdAt)}</Text>
                  </View>
                  <Text style={[styles.cardAmount, isPaid && { color: '#2E7D32' }]}>{formatVnd(payment.amount)}</Text>
                </View>

                {isPending && (
                  <View style={styles.payNowBanner}>
                    <AppIcon name="qr" size={14} color="#B8895A" />
                    <Text style={styles.payNow}>Chạm để quét mã QR thanh toán ngay ➔</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

        {!loading && hasMore && (
          <TouchableOpacity
            style={[styles.moreBtn, loadingMore && styles.btnDisabled]}
            onPress={loadMore}
            disabled={loadingMore}
            activeOpacity={0.85}
          >
            <Text style={styles.moreBtnText}>{loadingMore ? 'Đang tải...' : 'Tải thêm'}</Text>
          </TouchableOpacity>
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  filterChipActive: { backgroundColor: '#241F1A', borderColor: '#241F1A' },
  filterText: { color: '#6F6255', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#FAF5EE' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 14 },
  stateText: { color: '#6F6255', fontSize: 14, textAlign: 'center' },
  paymentSummaryCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  summaryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3EAE0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#8D7B68',
    fontWeight: '500',
    marginBottom: 2
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#241F1A',
    letterSpacing: 0.3
  },
  summaryRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFE3D3'
  },
  summaryMetricItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#241F1A'
  },
  summaryMetricLabel: {
    fontSize: 11,
    color: '#8D7B68',
    fontWeight: '500',
    marginTop: 2
  },
  summaryMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#EFE3D3'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5D9CA',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  emptyIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAF5EE',
    borderWidth: 1.5,
    borderColor: '#EFE3D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#241F1A',
    marginBottom: 6,
    textAlign: 'center'
  },
  emptySub: {
    fontSize: 13,
    color: '#6F6255',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 290
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B8895A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#B8895A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFE3D3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  paymentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE3D3'
  },
  paymentIconBoxPaid: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9'
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#241F1A' },
  cardSub: { fontSize: 12, color: '#9B8B7A', marginTop: 2 },
  pill: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3EAE0',
    marginVertical: 12
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardDate: { fontSize: 12, color: '#6F6255' },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#B8895A' },
  payNowBanner: {
    marginTop: 10,
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE082',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  payNow: { color: '#B8895A', fontWeight: '700', fontSize: 12 },
  primaryBtn: { backgroundColor: '#B8895A', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  moreBtn: {
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B8895A',
    paddingVertical: 11,
    paddingHorizontal: 26
  },
  moreBtnText: { color: '#B8895A', fontWeight: '800' },
  btnDisabled: { opacity: 0.6 }
});
