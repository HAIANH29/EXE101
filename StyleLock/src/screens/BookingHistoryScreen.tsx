import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { AppIcon, IconBadge } from '../components/AppIcon';
import { bookingService } from '../services/bookingService';
import { BottomNavBar } from '../components/BottomNavBar';
import { Booking, BookingStatus, Payment } from '../types';
import { formatDateTime, formatVnd, getPaymentStatusMeta, getPaymentTypeLabel } from '../utils/payment';
import { NotificationBellButton } from '../components/NotificationBellButton';

interface BookingHistoryScreenProps {
    navigation: any;
    route?: { params?: { initialTab?: string } };
}

const TABS = [
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Payment History', value: 'PAYMENTS' }
];

const PAYMENT_FILTERS = [
    { label: 'Tất cả', value: 'ALL' },
    { label: 'Đã thanh toán', value: 'PAID' },
    { label: 'Chờ thanh toán', value: 'PENDING' },
    { label: 'Hoàn tiền', value: 'REFUND' }
] as const;

export const BookingHistoryScreen: React.FC<BookingHistoryScreenProps> = ({ navigation, route }) => {
    const [activeTab, setActiveTab] = useState<string>(route?.params?.initialTab || 'UPCOMING');
    const [allBookings, setAllBookings] = useState<Booking[]>(bookingService.getAllBookings());
    const [paymentsByBooking, setPaymentsByBooking] = useState<Record<string, Payment>>({});
    const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
    const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REFUND'>('ALL');
    const [paymentsLoading, setPaymentsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (route?.params?.initialTab) {
            setActiveTab(route.params.initialTab);
        }
    }, [route?.params?.initialTab]);

    const today = new Date();
    const dateOptions = [0, 1, 2, 3, 4, 5].map((offset) => {
        const d = new Date();
        d.setDate(today.getDate() + offset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dayName = offset === 0 ? 'Hôm nay' : offset === 1 ? 'Ngày mai' : `Ngày ${dd}/${mm}`;
        return {
            fullDate: `${yyyy}-${mm}-${dd}`,
            label: `${dayName} (${dd}/${mm})`
        };
    });

    const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState<Booking | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<string>(dateOptions[1].fullDate);
    const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState<string>('');
    const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);
    const [availability, setAvailability] = useState<any>(undefined);
    const [slotsLoading, setSlotsLoading] = useState<boolean>(false);

    const loadPayments = async () => {
        setPaymentsLoading(true);
        try {
            const history = await backendApi.getPaymentHistory(0, 100);
            setPaymentsList(history.items);
            const map: Record<string, Payment> = {};
            history.items.forEach((payment) => {
                if (payment.bookingId) map[String(payment.bookingId)] = payment;
            });
            setPaymentsByBooking(map);
        } catch {
            // Trạng thái thanh toán là thông tin phụ, bỏ qua nếu tạm thời không tải được.
        } finally {
            setPaymentsLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadBackendBookings = async () => {
            if (!backendApi.isAuthenticated()) return;

            try {
                const apiBookings = await backendApi.getMyBookings();
                if (isMounted) {
                    setAllBookings(bookingService.replaceBookings(apiBookings));
                }
                if (isMounted) await loadPayments();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Không tải được lịch hẹn backend.';
                Alert.alert('Không tải được lịch hẹn', message);
            }
        };

        loadBackendBookings();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredBookings = allBookings.filter((b) => {
        if (activeTab === 'UPCOMING') {
            return b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_SERVICE';
        }
        if (activeTab === 'COMPLETED') {
            return b.status === 'COMPLETED';
        }
        if (activeTab === 'CANCELLED') {
            return b.status === 'CANCELLED';
        }
        return true;
    });

    const visiblePayments = useMemo(() => {
        return paymentsList.filter((payment) => {
            if (paymentFilter === 'ALL') return true;
            if (paymentFilter === 'REFUND') return payment.status === 'REFUND_PENDING' || payment.status === 'REFUNDED';
            return payment.status === paymentFilter;
        });
    }, [paymentsList, paymentFilter]);

    const getStatusBadge = (status: BookingStatus) => {
        switch (status) {
            case 'CONFIRMED':
                return { label: 'CONFIRMED', color: '#6B4227', bg: '#F3E7D8' };
            case 'PENDING':
                return { label: 'PENDING', color: '#6F6255', bg: '#F3E7D8' };
            case 'IN_SERVICE':
                return { label: 'IN SERVICE', color: '#B8895A', bg: '#F3E7D8' };
            case 'COMPLETED':
                return { label: 'COMPLETED', color: '#8A7748', bg: 'rgba(124, 138, 85, 0.16)' };
            case 'CANCELLED':
                return { label: 'CANCELLED', color: '#B65A4B', bg: '#FBE7E1' };
            default:
                return { label: status, color: '#6F6255', bg: '#F3E7D8' };
        }
    };

    const handleCancelBooking = (bookingId: string) => {
        const payment = paymentsByBooking[bookingId];
        const refundNote =
            payment?.status === 'PAID'
                ? '\n\nLịch hẹn này đã thanh toán. Khoản tiền sẽ được hoàn lại sau khi quản trị viên xác nhận, bạn có thể theo dõi trong Lịch sử thanh toán.'
                : '';
        Alert.alert(
            'Hủy lịch hẹn',
            `Bạn có chắc chắn muốn hủy lịch hẹn này?${refundNote}`,
            [
                { text: 'Bỏ qua', style: 'cancel' },
                {
                    text: 'Xác nhận Hủy',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const booking = allBookings.find((item) => item.id === bookingId);
                            if (!booking?.apiId) {
                                throw new Error('Không tìm thấy lịch hẹn trên hệ thống.');
                            }
                            const cancelled = await backendApi.cancelBooking(booking.apiId.toString(), 'Khách hủy từ StyleLock app');
                            bookingService.upsertBooking(cancelled);
                            setAllBookings(bookingService.getAllBookings());
                            loadPayments();
                            Alert.alert('Đã hủy', 'Lịch hẹn của bạn đã được hủy thành công.');
                        } catch (error) {
                            const message = error instanceof Error ? error.message : 'Không thể hủy booking backend.';
                            Alert.alert('Hủy thất bại', message);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (!rescheduleBookingTarget) {
            setAvailability(undefined);
            return;
        }

        const salonApiId = rescheduleBookingTarget.salonId
            ? Number(String(rescheduleBookingTarget.salonId).replace(/\D/g, ''))
            : undefined;
        const stylistApiId = rescheduleBookingTarget.stylistId
            ? Number(String(rescheduleBookingTarget.stylistId).replace(/\D/g, ''))
            : undefined;

        if (!salonApiId || !stylistApiId) {
            setAvailability(undefined);
            return;
        }

        let isMounted = true;
        setSlotsLoading(true);
        backendApi
            .getAvailability(salonApiId, stylistApiId, rescheduleDate)
            .then((res) => {
                if (isMounted) setAvailability(res);
            })
            .catch(() => {
                if (isMounted) setAvailability(undefined);
            })
            .finally(() => {
                if (isMounted) setSlotsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [rescheduleBookingTarget, rescheduleDate]);

    const handleReschedule = (b: Booking) => {
        if (b.status === 'COMPLETED' || b.status === 'CANCELLED') {
            Alert.alert('Không thể đổi lịch', 'Lịch hẹn này đã hoàn thành hoặc đã bị hủy.');
            return;
        }
        setRescheduleBookingTarget(b);
        setRescheduleDate(dateOptions[1].fullDate);
        setRescheduleTimeSlot('');
    };

    const handleConfirmReschedule = async () => {
        if (!rescheduleBookingTarget) return;
        if (!rescheduleTimeSlot) {
            Alert.alert('Chưa chọn giờ', 'Vui lòng chọn khung giờ hẹn mới!');
            return;
        }

        setIsSubmittingReschedule(true);
        try {
            if (rescheduleBookingTarget.apiId) {
                const updated = await backendApi.rescheduleBooking(
                    rescheduleBookingTarget.apiId,
                    rescheduleDate,
                    rescheduleTimeSlot
                );
                bookingService.upsertBooking(updated);
            } else {
                const localUpdated: Booking = {
                    ...rescheduleBookingTarget,
                    date: rescheduleDate,
                    timeSlot: rescheduleTimeSlot
                };
                bookingService.upsertBooking(localUpdated);
            }

            setAllBookings(bookingService.getAllBookings());
            const targetSalon = rescheduleBookingTarget.salonName;
            setRescheduleBookingTarget(null);

            Alert.alert(
                '✨ Đổi lịch thành công',
                `Lịch hẹn tại ${targetSalon} đã được chuyển sang ngày ${rescheduleDate} lúc ${rescheduleTimeSlot}.`
            );
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Không thể đổi lịch hẹn.';
            Alert.alert('Đổi lịch thất bại', message);
        } finally {
            setIsSubmittingReschedule(false);
        }
    };

    const pad = (n: number) => String(n).padStart(2, '0');
    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const getRescheduleSlots = () => {
        if (availability && !availability.closed && availability.openTime && availability.closeTime) {
            const open = toMinutes(availability.openTime);
            const close = toMinutes(availability.closeTime);
            const booked = (availability.bookedIntervals || []).map((interval: any) => ({
                start: new Date(interval.startAt).getTime(),
                end: new Date(interval.endAt).getTime()
            }));

            const slots = [];
            for (let minute = open; minute + 30 <= close; minute += 30) {
                const value = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`;
                const start = new Date(`${rescheduleDate}T${value}:00+07:00`).getTime();
                const end = start + 30 * 60000;
                const isPast = start <= Date.now();
                const overlaps = booked.some((interval: any) => interval.start < end && interval.end > start);
                slots.push({ value, disabled: isPast || overlaps });
            }
            return slots;
        }

        const defaultList = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
            '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
        ];
        return defaultList.map((val) => {
            const start = new Date(`${rescheduleDate}T${val}:00+07:00`).getTime();
            return { value: val, disabled: start <= Date.now() };
        });
    };

    const handleMessage = (b: Booking) => {
        Alert.alert('Tin nhắn', `Đang kết nối chat trực tiếp với ${b.salonName}...`);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top App Bar */}
            <View style={styles.topAppBar}>
                <Text style={styles.brandTitle}>StyleLock</Text>

                <View style={styles.headerRightActions}>
                    <TouchableOpacity
                        style={[styles.headerIconBtn, activeTab === 'PAYMENTS' && styles.headerIconBtnActive]}
                        onPress={() => setActiveTab(activeTab === 'PAYMENTS' ? 'UPCOMING' : 'PAYMENTS')}
                        activeOpacity={0.8}
                    >
                        <AppIcon name="card" size={18} color={activeTab === 'PAYMENTS' ? '#2C2219' : '#B8895A'} />
                    </TouchableOpacity>
                    <NotificationBellButton navigation={navigation} style={styles.headerIconBtn} />
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.8}
                    >
                        <AppIcon name="user" size={20} color="#B8895A" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Page Title */}
                <Text style={styles.pageTitle}>
                    {activeTab === 'PAYMENTS' ? 'Payment History' : 'My Bookings'}
                </Text>

                {/* Filter Tabs Scroll */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                    style={styles.tabsScrollWrapper}
                >
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.value;
                        return (
                            <TouchableOpacity
                                key={tab.value}
                                style={[styles.tabChip, isActive && styles.tabChipActive]}
                                onPress={() => setActiveTab(tab.value)}
                            >
                                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Main Content: Payments or Bookings */}
                {activeTab === 'PAYMENTS' ? (
                    <View style={styles.paymentsSection}>
                        {/* Sub-Filters for Payments */}
                        <View style={styles.paymentFiltersRow}>
                            {PAYMENT_FILTERS.map((pf) => {
                                const isFilterActive = paymentFilter === pf.value;
                                return (
                                    <TouchableOpacity
                                        key={pf.value}
                                        style={[styles.paymentFilterChip, isFilterActive && styles.paymentFilterChipActive]}
                                        onPress={() => setPaymentFilter(pf.value)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.paymentFilterText, isFilterActive && styles.paymentFilterTextActive]}>
                                            {pf.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {paymentsLoading ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator color="#B8895A" />
                                <Text style={styles.loadingText}>Đang tải lịch sử thanh toán...</Text>
                            </View>
                        ) : visiblePayments.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <IconBadge name="card" size={24} containerStyle={styles.emptyIconBadge} />
                                <Text style={styles.emptyTitle}>
                                    {paymentsList.length === 0
                                        ? 'Bạn chưa có giao dịch thanh toán nào.'
                                        : 'Không có giao dịch nào ở mục này.'}
                                </Text>
                                <Text style={styles.emptySub}>
                                    Các giao dịch giữ chỗ và hóa đơn dịch vụ sẽ xuất hiện tại đây.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.paymentsList}>
                                {visiblePayments.map((payment) => {
                                    const meta = getPaymentStatusMeta(payment.status);
                                    const matchedBooking = allBookings.find(
                                        (b) => b.id === String(payment.bookingId) || (payment.bookingId && b.apiId === payment.bookingId)
                                    );

                                    return (
                                        <TouchableOpacity
                                            key={payment.id}
                                            style={styles.paymentCard}
                                            activeOpacity={0.88}
                                            onPress={() => {
                                                if (payment.status === 'PENDING') {
                                                    navigation.navigate('Payment', {
                                                        bookingId: payment.bookingId,
                                                        paymentId: payment.id
                                                    });
                                                } else if (matchedBooking) {
                                                    navigation.navigate('BookingStatus', { bookingId: matchedBooking.id });
                                                }
                                            }}
                                        >
                                            <View style={styles.paymentCardTop}>
                                                <View style={styles.paymentCardHeaderLeft}>
                                                    <View style={styles.paymentIconBox}>
                                                        <AppIcon name="card" size={18} color="#B8895A" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.paymentTypeTitle} numberOfLines={1}>
                                                            {matchedBooking?.salonName || getPaymentTypeLabel(payment)}
                                                        </Text>
                                                        <Text style={styles.paymentReferenceCode}>
                                                            {payment.bookingId ? `Lịch hẹn #${payment.bookingId} · ` : ''}
                                                            Mã: {payment.referenceCode}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <View style={[styles.paymentStatusPill, { backgroundColor: meta.background }]}>
                                                    <Text style={[styles.paymentStatusPillText, { color: meta.color }]}>
                                                        {meta.label}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.paymentCardDivider} />

                                            <View style={styles.paymentCardBottom}>
                                                <View style={styles.paymentDateRow}>
                                                    <AppIcon name="clock" size={13} color="#9B8B7A" />
                                                    <Text style={styles.paymentDateText}>
                                                        {formatDateTime(payment.paidAt || payment.createdAt)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.paymentAmountText}>
                                                    {formatVnd(payment.amount)}
                                                </Text>
                                            </View>

                                            {payment.status === 'PENDING' && (
                                                <View style={styles.payNowBanner}>
                                                    <Text style={styles.payNowText}>Chạm để quét mã QR thanh toán ngay ➔</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                ) : filteredBookings.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <IconBadge name="calendar" size={24} containerStyle={styles.emptyIconBadge} />
                        <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
                        <Text style={styles.emptySub}>Khám phá các kiểu tóc mới và đặt lịch giữ chỗ ngay hôm nay!</Text>
                        <TouchableOpacity
                            style={styles.exploreBtn}
                            onPress={() => navigation.navigate('HairstyleSelect')}
                        >
                            <Text style={styles.exploreBtnText}>Khám phá kiểu tóc</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.bookingsList}>
                        {filteredBookings.map((b) => {
                            const badge = getStatusBadge(b.status);
                            const payment = paymentsByBooking[b.id];
                            const paymentMeta = payment ? getPaymentStatusMeta(payment.status) : undefined;
                            const canPay = payment?.status === 'PENDING' && (b.status === 'PENDING' || b.status === 'CONFIRMED');
                            const cardImage =
                                b.tryOnImageUrl ||
                                'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400';

                            return (
                                <View key={b.id} style={styles.bookingCard}>
                                    {/* Top Part: Image & Info */}
                                    <TouchableOpacity
                                        style={styles.cardHeader}
                                        activeOpacity={0.9}
                                        onPress={() => navigation.navigate('BookingStatus', { bookingId: b.id })}
                                    >
                                        <Image source={{ uri: cardImage }} style={styles.salonImg} />

                                        <View style={styles.cardDetails}>
                                            <View style={styles.titleBadgeRow}>
                                                <Text style={styles.salonName} numberOfLines={1}>
                                                    {b.salonName}
                                                </Text>
                                                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                                                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text style={styles.serviceDesc} numberOfLines={1}>
                                                {b.serviceName || b.hairstyleName || 'Cắt tóc & Styling'}
                                            </Text>

                                            <View style={styles.metaRow}>
                                                <AppIcon name="calendar" size={13} color="#9B8B7A" />
                                                <Text style={styles.metaText}>{b.date}</Text>
                                            </View>

                                            <View style={styles.metaRow}>
                                                <AppIcon name="clock" size={13} color="#9B8B7A" />
                                                <Text style={styles.metaText}>{b.timeSlot}</Text>
                                            </View>

                                            {payment && paymentMeta && (
                                                <View style={[styles.paymentPill, { backgroundColor: paymentMeta.background }]}>
                                                    <Text style={[styles.paymentPillText, { color: paymentMeta.color }]}>
                                                        {paymentMeta.label} · {formatVnd(payment.amount)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Bottom Actions Row */}
                                    <View style={styles.cardActions}>
                                        {canPay && (
                                            <TouchableOpacity
                                                style={styles.payBtn}
                                                onPress={() => navigation.navigate('Payment', { bookingId: b.id })}
                                            >
                                                <Text style={styles.payBtnText}>Thanh toán</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Show Cancel Button for Pending bookings */}
                                        {b.status === 'PENDING' && (
                                            <TouchableOpacity
                                                style={styles.cancelBtn}
                                                onPress={() => handleCancelBooking(b.id)}
                                            >
                                                <AppIcon name="close" size={18} color="#B65A4B" />
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={styles.rescheduleBtn}
                                            onPress={() => handleReschedule(b)}
                                        >
                                            <Text style={styles.rescheduleText}>Reschedule</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.messageBtn}
                                            onPress={() => handleMessage(b)}
                                        >
                                            <Text style={styles.messageText}>Message</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal Đổi Lịch Hẹn */}
            <Modal
                visible={!!rescheduleBookingTarget}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRescheduleBookingTarget(null)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setRescheduleBookingTarget(null)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalCard}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <AppIcon name="calendar" size={20} color="#B8895A" />
                                <Text style={styles.modalTitle}>Đổi lịch hẹn</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setRescheduleBookingTarget(null)}
                            >
                                <AppIcon name="close" size={16} color="#2C2219" />
                            </TouchableOpacity>
                        </View>

                        {/* Booking Summary Box */}
                        {rescheduleBookingTarget && (
                            <View style={styles.modalSummaryBox}>
                                <Text style={styles.modalSalonName}>{rescheduleBookingTarget.salonName}</Text>
                                <Text style={styles.modalServiceText}>
                                    {rescheduleBookingTarget.serviceName || rescheduleBookingTarget.hairstyleName || 'Dịch vụ làm tóc'}
                                    {rescheduleBookingTarget.stylistName ? ` · Stylist: ${rescheduleBookingTarget.stylistName}` : ''}
                                </Text>
                                <View style={styles.modalCurrentTimeRow}>
                                    <Text style={styles.modalCurrentTimeLabel}>Giờ hiện tại:</Text>
                                    <Text style={styles.modalCurrentTimeValue}>
                                        {rescheduleBookingTarget.date} · {rescheduleBookingTarget.timeSlot}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Date Selector */}
                        <Text style={styles.modalSectionTitle}>1. Chọn ngày hẹn mới</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.modalDateScroll}
                        >
                            {dateOptions.map((opt) => {
                                const isDateActive = rescheduleDate === opt.fullDate;
                                return (
                                    <TouchableOpacity
                                        key={opt.fullDate}
                                        style={[styles.modalDateChip, isDateActive && styles.modalDateChipActive]}
                                        onPress={() => {
                                            setRescheduleDate(opt.fullDate);
                                            setRescheduleTimeSlot('');
                                        }}
                                    >
                                        <Text style={[styles.modalDateChipText, isDateActive && styles.modalDateChipTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Time Slot Selector */}
                        <Text style={styles.modalSectionTitle}>2. Chọn khung giờ mới</Text>
                        {slotsLoading ? (
                            <View style={styles.slotsLoadingBox}>
                                <ActivityIndicator size="small" color="#B8895A" />
                                <Text style={styles.slotsLoadingText}>Đang kiểm tra lịch trống...</Text>
                            </View>
                        ) : (
                            <View style={styles.slotsGrid}>
                                {getRescheduleSlots().map((slot) => {
                                    const isSlotActive = rescheduleTimeSlot === slot.value;
                                    return (
                                        <TouchableOpacity
                                            key={slot.value}
                                            disabled={slot.disabled}
                                            style={[
                                                styles.slotPill,
                                                isSlotActive && styles.slotPillActive,
                                                slot.disabled && styles.slotPillDisabled
                                            ]}
                                            onPress={() => setRescheduleTimeSlot(slot.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.slotPillText,
                                                    isSlotActive && styles.slotPillTextActive,
                                                    slot.disabled && styles.slotPillTextDisabled
                                                ]}
                                            >
                                                {slot.value}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.modalActionsRow}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setRescheduleBookingTarget(null)}
                            >
                                <Text style={styles.modalCancelBtnText}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalSubmitBtn, (!rescheduleTimeSlot || isSubmittingReschedule) && styles.modalSubmitBtnDisabled]}
                                disabled={!rescheduleTimeSlot || isSubmittingReschedule}
                                onPress={handleConfirmReschedule}
                            >
                                {isSubmittingReschedule ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalSubmitBtnText}>Xác nhận đổi lịch</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <BottomNavBar active="History" navigation={navigation} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFE6D8'
    },
    topAppBar: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 253, 249, 0.96)',
        borderBottomWidth: 1,
        borderBottomColor: '#E5D9CA',
        zIndex: 10
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    headerIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7EFE4'
    },
    headerIconBtnActive: {
        backgroundColor: '#EFE2D1',
        borderWidth: 1,
        borderColor: '#B8895A'
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#B8895A',
        letterSpacing: -0.5
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#241F1A',
        marginBottom: 16
    },
    tabsScrollWrapper: {
        marginBottom: 16,
        marginHorizontal: -20
    },
    tabsScroll: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20
    },
    tabChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDCBB5',
        backgroundColor: '#FFFFFF'
    },
    tabChipActive: {
        backgroundColor: '#B8895A',
        borderColor: '#B8895A'
    },
    tabChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6F6255'
    },
    tabChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700'
    },
    paymentsSection: {
        gap: 12
    },
    paymentFiltersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8
    },
    paymentFilterChip: {
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0D2C1'
    },
    paymentFilterChipActive: {
        backgroundColor: '#B8895A',
        borderColor: '#B8895A'
    },
    paymentFilterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6F6255'
    },
    paymentFilterTextActive: {
        color: '#FFFFFF',
        fontWeight: '700'
    },
    paymentsList: {
        gap: 12
    },
    paymentCard: {
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
    paymentCardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10
    },
    paymentCardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1
    },
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
    paymentTypeTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2C2219'
    },
    paymentReferenceCode: {
        fontSize: 12,
        color: '#9B8B7A',
        marginTop: 2
    },
    paymentStatusPill: {
        borderRadius: 12,
        paddingVertical: 4,
        paddingHorizontal: 10
    },
    paymentStatusPillText: {
        fontSize: 11,
        fontWeight: '700'
    },
    paymentCardDivider: {
        height: 1,
        backgroundColor: '#F3EAE0',
        marginVertical: 12
    },
    paymentCardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    paymentDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    paymentDateText: {
        fontSize: 12,
        color: '#6F6255'
    },
    paymentAmountText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#B8895A'
    },
    payNowBanner: {
        marginTop: 10,
        backgroundColor: '#FAF5EE',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EFE3D3'
    },
    payNowText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B8895A'
    },
    loadingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 10
    },
    loadingText: {
        fontSize: 13,
        color: '#9B8B7A'
    },
    bookingsList: {
        gap: 16
    },
    bookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5D9CA',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 16,
        gap: 14
    },
    salonImg: {
        width: 80,
        height: 80,
        borderRadius: 14,
        backgroundColor: '#F3E7D8'
    },
    cardDetails: {
        flex: 1
    },
    titleBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    salonName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#241F1A',
        flex: 1,
        marginRight: 6
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5
    },
    serviceDesc: {
        fontSize: 13,
        color: '#6F6255',
        marginBottom: 8
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2
    },
    metaText: {
        fontSize: 12,
        color: '#6F6255'
    },
    paymentPill: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingVertical: 3,
        paddingHorizontal: 9,
        marginTop: 6
    },
    paymentPillText: {
        fontSize: 11,
        fontWeight: '800'
    },
    payBtn: {
        width: '100%',
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#B8895A',
        justifyContent: 'center',
        alignItems: 'center'
    },
    payBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800'
    },
    cardActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: '#E5D9CA',
        padding: 12,
        gap: 10
    },
    cancelBtn: {
        width: 52,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D9A195',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FBE7E1'
    },
    rescheduleBtn: {
        flex: 1,
        minWidth: 90,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#B8895A',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    },
    rescheduleText: {
        color: '#B8895A',
        fontSize: 14,
        fontWeight: '600'
    },
    messageBtn: {
        flex: 1,
        minWidth: 90,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#B8895A',
        justifyContent: 'center',
        alignItems: 'center'
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600'
    },
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5D9CA',
        marginTop: 20
    },
    emptyIconBadge: {
        width: 58,
        height: 58,
        borderRadius: 29,
        marginBottom: 12
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#241F1A',
        marginBottom: 6
    },
    emptySub: {
        fontSize: 13,
        color: '#6F6255',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16
    },
    exploreBtn: {
        backgroundColor: '#B8895A',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EFE3D3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2C2219'
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FAF6F0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalSummaryBox: {
        backgroundColor: '#FAF6F0',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EFE3D3',
        marginBottom: 16
    },
    modalSalonName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2C2219',
        marginBottom: 3
    },
    modalServiceText: {
        fontSize: 13,
        color: '#6F6255',
        marginBottom: 6
    },
    modalCurrentTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    modalCurrentTimeLabel: {
        fontSize: 12,
        color: '#9B8B7A'
    },
    modalCurrentTimeValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B65A4B'
    },
    modalSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6F6255',
        marginBottom: 8,
        marginTop: 4
    },
    modalDateScroll: {
        gap: 8,
        paddingBottom: 12
    },
    modalDateChip: {
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#F3EAE0',
        borderWidth: 1,
        borderColor: 'transparent'
    },
    modalDateChipActive: {
        backgroundColor: '#B8895A',
        borderColor: '#B8895A'
    },
    modalDateChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6F6255'
    },
    modalDateChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700'
    },
    slotsLoadingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16
    },
    slotsLoadingText: {
        fontSize: 12,
        color: '#9B8B7A'
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16
    },
    slotPill: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0D2C1'
    },
    slotPillActive: {
        backgroundColor: '#B8895A',
        borderColor: '#B8895A'
    },
    slotPillDisabled: {
        backgroundColor: '#F7F3EE',
        borderColor: '#EAE3DA',
        opacity: 0.55
    },
    slotPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2C2219'
    },
    slotPillTextActive: {
        color: '#FFFFFF',
        fontWeight: '700'
    },
    slotPillTextDisabled: {
        color: '#B8ABA0'
    },
    modalActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6
    },
    modalCancelBtn: {
        flex: 1,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#FAF6F0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5D9CA'
    },
    modalCancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6F6255'
    },
    modalSubmitBtn: {
        flex: 2,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#B8895A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#B8895A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3
    },
    modalSubmitBtnDisabled: {
        opacity: 0.5
    },
    modalSubmitBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF'
    }
});

