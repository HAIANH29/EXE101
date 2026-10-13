import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { backendApi } from '../services/backendApi';
import { AppIcon, IconBadge } from '../components/AppIcon';
import { bookingService } from '../services/bookingService';
import { BottomNavBar } from '../components/BottomNavBar';
import { Booking, BookingStatus, Payment } from '../types';
import { formatVnd, getPaymentStatusMeta } from '../utils/payment';
import { NotificationBellButton } from '../components/NotificationBellButton';

interface BookingHistoryScreenProps {
    navigation: any;
}

const TABS = [
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' }
];

export const BookingHistoryScreen: React.FC<BookingHistoryScreenProps> = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState<string>('UPCOMING');
    const [allBookings, setAllBookings] = useState<Booking[]>(bookingService.getAllBookings());
    const [paymentsByBooking, setPaymentsByBooking] = useState<Record<string, Payment>>({});

    const loadPayments = async () => {
        try {
            const history = await backendApi.getPaymentHistory(0, 100);
            const map: Record<string, Payment> = {};
            history.items.forEach((payment) => {
                if (payment.bookingId) map[String(payment.bookingId)] = payment;
            });
            setPaymentsByBooking(map);
        } catch {
            // Trạng thái thanh toán là thông tin phụ, bỏ qua nếu tạm thời không tải được.
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

    const handleReschedule = (b: Booking) => {
        Alert.alert(
            'Đổi lịch hẹn',
            `Bạn muốn chọn lại thời gian cho lịch hẹn tại ${b.salonName}?`,
            [
                { text: 'Đóng', style: 'cancel' },
                {
                    text: 'Chọn giờ mới',
                    onPress: () =>
                        navigation.navigate('SalonDetail', {
                            salon: { id: b.salonId, name: b.salonName, address: b.salonAddress, services: [] }
                        })
                }
            ]
        );
    };

    const handleMessage = (b: Booking) => {
        Alert.alert('Tin nhắn', `Đang kết nối chat trực tiếp với ${b.salonName}...`);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top App Bar */}
            <View style={styles.topAppBar}>
                <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        } else {
                            navigation.navigate('Home');
                        }
                    }}
                >
                    <AppIcon name="menu" size={22} color="#B8895A" />
                </TouchableOpacity>

                <Text style={styles.brandTitle}>StyleLock</Text>

                <View style={styles.headerRightActions}>
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
                <Text style={styles.pageTitle}>My Bookings</Text>

                {/* Filter Tabs */}
                <View style={styles.tabsRow}>
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
                </View>

                {/* Bookings List */}
                {filteredBookings.length === 0 ? (
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
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
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
    tabsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
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
    }
});

