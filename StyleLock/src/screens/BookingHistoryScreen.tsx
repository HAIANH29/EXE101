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
import { Booking, BookingStatus } from '../types';
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

    useEffect(() => {
        let isMounted = true;

        const loadBackendBookings = async () => {
            if (!backendApi.isAuthenticated()) return;

            try {
                const apiBookings = await backendApi.getMyBookings();
                if (isMounted) {
                    setAllBookings(bookingService.replaceBookings(apiBookings));
                }
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
                return { label: 'CONFIRMED', color: '#074D44', bg: '#DDEBE3' };
            case 'PENDING':
                return { label: 'PENDING', color: '#687572', bg: '#DDEBE3' };
            case 'IN_SERVICE':
                return { label: 'IN SERVICE', color: '#005C55', bg: '#DDEBE3' };
            case 'COMPLETED':
                return { label: 'COMPLETED', color: '#7C8A55', bg: 'rgba(124, 138, 85, 0.16)' };
            case 'CANCELLED':
                return { label: 'CANCELLED', color: '#B65A4B', bg: '#FBE7E1' };
            default:
                return { label: status, color: '#687572', bg: '#E3EFEB' };
        }
    };

    const handleCancelBooking = (bookingId: string) => {
        Alert.alert(
            'Hủy lịch hẹn',
            'Bạn có chắc chắn muốn hủy lịch hẹn này?',
            [
                { text: 'Bỏ qua', style: 'cancel' },
                {
                    text: 'Xác nhận Hủy',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const booking = allBookings.find((item) => item.id === bookingId);
                            if (booking?.apiId && backendApi.isAuthenticated()) {
                                const cancelled = await backendApi.cancelBooking(booking.apiId.toString(), 'Khách hủy từ StyleLock app');
                                bookingService.upsertBooking(cancelled);
                            } else {
                                bookingService.updateBookingStatus(bookingId, 'CANCELLED');
                            }
                            setAllBookings(bookingService.getAllBookings());
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
                    <AppIcon name="menu" size={22} color="#005C55" />
                </TouchableOpacity>

                <Text style={styles.brandTitle}>StyleLock</Text>

                <View style={styles.headerRightActions}>
                    <NotificationBellButton navigation={navigation} style={styles.headerIconBtn} />
                    <TouchableOpacity
                        style={styles.headerIconBtn}
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.8}
                    >
                        <AppIcon name="user" size={20} color="#005C55" />
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
                                                <AppIcon name="calendar" size={13} color="#8A9894" />
                                                <Text style={styles.metaText}>{b.date}</Text>
                                            </View>

                                            <View style={styles.metaRow}>
                                                <AppIcon name="clock" size={13} color="#8A9894" />
                                                <Text style={styles.metaText}>{b.timeSlot}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Bottom Actions Row */}
                                    <View style={styles.cardActions}>
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
        backgroundColor: '#F7F9F4'
    },
    topAppBar: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E6E1',
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
        backgroundColor: '#F0F5F3'
    },
    brandTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#005C55',
        letterSpacing: -0.5
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#182C2A',
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
        borderColor: '#D0D8D4',
        backgroundColor: '#FFFFFF'
    },
    tabChipActive: {
        backgroundColor: '#005C55',
        borderColor: '#005C55'
    },
    tabChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#687572'
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
        borderColor: '#E2E6E1',
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
        backgroundColor: '#E3EFEB'
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
        color: '#182C2A',
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
        color: '#687572',
        marginBottom: 8
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2
    },
    metaIcon: {
        fontSize: 12
    },
    metaText: {
        fontSize: 12,
        color: '#687572'
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E2E6E1',
        padding: 12,
        gap: 10
    },
    cancelBtn: {
        width: 52,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3D2CC',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDF3F1'
    },
    cancelBtnIcon: {
        fontSize: 16,
        color: '#B65A4B',
        fontWeight: '700'
    },
    rescheduleBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#005C55',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    },
    rescheduleText: {
        color: '#005C55',
        fontSize: 14,
        fontWeight: '600'
    },
    messageBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#005C55',
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
        borderColor: '#E2E6E1',
        marginTop: 20
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12
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
        color: '#182C2A',
        marginBottom: 6
    },
    emptySub: {
        fontSize: 13,
        color: '#687572',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16
    },
    exploreBtn: {
        backgroundColor: '#005C55',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12
    },
    exploreBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#D0D8D4',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20
    },
    navItemActive: {
        backgroundColor: 'rgba(0, 92, 85, 0.16)'
    },
    navIcon: {
        fontSize: 18,
        marginBottom: 2
    },
    navIconActive: {
        transform: [{ scale: 1.1 }]
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#687572'
    },
    navLabelActive: {
        color: '#005C55',
        fontWeight: '700'
    }
});
