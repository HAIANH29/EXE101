import React, { useCallback, useEffect, useState } from 'react';
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
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator color="#B8895A" />
            <Text style={styles.stateText}>Đang tải...</Text>
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
          <View style={styles.centerState}>
            <IconBadge name="card" size={22} color="#B8895A" backgroundColor="#F3E7D8" />
            <Text style={styles.stateText}>
              {payments.length === 0 ? 'Bạn chưa có giao dịch nào.' : 'Không có giao dịch nào ở mục này.'}
            </Text>
          </View>
        )}

        {!loading &&
          visible.map((payment) => {
            const meta = getPaymentStatusMeta(payment.status);
            return (
              <TouchableOpacity
                key={payment.id}
                style={styles.card}
                onPress={() => navigation.navigate('Payment', { paymentId: payment.id })}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{getPaymentTypeLabel(payment)}</Text>
                    <Text style={styles.cardSub}>
                      {payment.bookingId ? `Lịch hẹn #${payment.bookingId} · ` : ''}
                      {payment.referenceCode}
                    </Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: meta.background }]}>
                    <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardDate}>{formatDateTime(payment.paidAt || payment.createdAt)}</Text>
                  <Text style={styles.cardAmount}>{formatVnd(payment.amount)}</Text>
                </View>

                {payment.status === 'PENDING' && (
                  <Text style={styles.payNow}>Chạm để thanh toán ngay ➔</Text>
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
  filterChipActive: { backgroundColor: '#B8895A', borderColor: '#B8895A' },
  filterText: { color: '#6F6255', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 14 },
  stateText: { color: '#6F6255', fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5D9CA'
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#241F1A' },
  cardSub: { fontSize: 12, color: '#9B8B7A', marginTop: 3 },
  pill: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  pillText: { fontSize: 11, fontWeight: '900' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cardDate: { fontSize: 12, color: '#6F6255' },
  cardAmount: { fontSize: 16, fontWeight: '900', color: '#B8895A' },
  payNow: { marginTop: 10, color: '#B8895A', fontWeight: '800', fontSize: 12 },
  primaryBtn: { backgroundColor: '#B8895A', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  moreBtn: {
    alignSelf: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B8895A',
    paddingVertical: 11,
    paddingHorizontal: 26
  },
  moreBtnText: { color: '#B8895A', fontWeight: '900' },
  btnDisabled: { opacity: 0.6 }
});
