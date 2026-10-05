import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { LocalizedText as Text, LocalizedAlert as Alert } from '../i18n/LocalizedComponents';
import { useFocusEffect } from '@react-navigation/native';
import { AppIcon, AppIconName, IconBadge } from '../components/AppIcon';
import { backendApi } from '../services/backendApi';
import { NotificationItem, NotificationType } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

type NotificationsScreenProps = {
  navigation: any;
};

type NotificationMeta = {
  icon: AppIconName;
  color: string;
  backgroundColor: string;
  label: string;
};

const TYPE_META: Record<NotificationType, NotificationMeta> = {
  BOOKING_CREATED: {
    icon: 'calendar',
    color: '#005C55',
    backgroundColor: '#DDEBE3',
    label: 'Đặt lịch'
  },
  BOOKING_CONFIRMED: {
    icon: 'check',
    color: '#7C8A55',
    backgroundColor: '#DCFCE7',
    label: 'Xác nhận'
  },
  BOOKING_CANCELLED: {
    icon: 'close',
    color: '#B65A4B',
    backgroundColor: '#FBE7E1',
    label: 'Đã hủy'
  },
  BOOKING_COMPLETED: {
    icon: 'star',
    color: '#005C55',
    backgroundColor: '#EFF6F1',
    label: 'Hoàn tất'
  },
  PAYMENT_COMPLETED: {
    icon: 'money',
    color: '#005C55',
    backgroundColor: '#E3EFEB',
    label: 'Thanh toán'
  }
};

function getMeta(type: NotificationItem['type']): NotificationMeta {
  return TYPE_META[type] || {
    icon: 'bell',
    color: '#005C55',
    backgroundColor: '#DDEBE3',
    label: 'Thông báo'
  };
}

function formatTime(value: string, language: 'vi' | 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Math.max(Date.now() - date.getTime(), 0);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function isBookingRelated(type: NotificationItem['type']) {
  return type.startsWith('BOOKING') || type === 'PAYMENT_COMPLETED';
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const loadNotifications = useCallback(async (refresh = false) => {
    if (!backendApi.isAuthenticated()) {
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      setErrorMessage('Bạn cần đăng nhập để xem thông báo.');
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const items = await backendApi.getNotifications();
      setNotifications(items);
      setErrorMessage(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không tải được thông báo.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markNotificationRead = async (notification: NotificationItem) => {
    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );

      try {
        await backendApi.markNotificationAsRead(notification.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không đánh dấu đã đọc được.';
        Alert.alert('Thông báo', message);
        loadNotifications(true);
        return;
      }
    }

    const actions = isBookingRelated(notification.type)
      ? [
          { text: 'Đóng', style: 'cancel' as const },
          {
            text: 'Xem lịch hẹn',
            onPress: () => navigation.navigate('BookingHistory')
          }
        ]
      : [{ text: 'Đóng', style: 'cancel' as const }];

    Alert.alert(notification.title, notification.content, actions);
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((current) => current.map((item) => ({ ...item, read: true })));

    try {
      await backendApi.markAllNotificationsAsRead();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không đánh dấu tất cả đã đọc được.';
      Alert.alert('Thông báo', message);
      loadNotifications(true);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color="#005C55" />
          <Text style={styles.centerText}>Đang tải thông báo...</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.centerState}>
          <IconBadge
            name="bell"
            size={24}
            color="#005C55"
            containerStyle={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Chưa xem được thông báo</Text>
          <Text style={styles.emptyText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (notifications.length === 0) {
      return (
        <View style={styles.centerState}>
          <IconBadge
            name="bell"
            size={24}
            color="#005C55"
            containerStyle={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
          <Text style={styles.emptyText}>
            Khi lịch hẹn hoặc thanh toán có thay đổi, thông báo sẽ xuất hiện ở đây.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {notifications.map((notification) => {
          const meta = getMeta(notification.type);
          return (
            <TouchableOpacity
              key={notification.id}
              activeOpacity={0.88}
              style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
              onPress={() => markNotificationRead(notification)}
            >
              <IconBadge
                name={meta.icon}
                size={20}
                color={meta.color}
                backgroundColor={meta.backgroundColor}
                borderColor="transparent"
                containerStyle={styles.notificationIcon}
              />

              <View style={styles.notificationBody}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationContent} numberOfLines={2}>
                  {notification.content}
                </Text>

                <View style={styles.notificationMetaRow}>
                  <Text style={[styles.typeChip, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                  <Text style={styles.timeText}>{formatTime(notification.createdAt, language)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topAppBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <AppIcon name="arrowLeft" size={22} color="#005C55" />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Thông báo</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả đã được đọc'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
          onPress={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <AppIcon name="check" size={18} color={unreadCount === 0 ? '#8A9894' : '#005C55'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor="#005C55"
            colors={['#005C55']}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFFFE'
  },
  topAppBar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(251, 255, 254, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#D0D8D4'
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: 14
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#182C2A'
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8A9894',
    fontWeight: '600'
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDEBE3',
    borderWidth: 1,
    borderColor: 'rgba(0, 92, 85, 0.16)'
  },
  markAllButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#D0D8D4'
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34
  },
  list: {
    gap: 12
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EFEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2
  },
  notificationCardUnread: {
    borderColor: 'rgba(0, 92, 85, 0.28)',
    backgroundColor: '#FBFFFE'
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21
  },
  notificationBody: {
    flex: 1,
    minWidth: 0
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#182C2A'
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#B65A4B'
  },
  notificationContent: {
    fontSize: 13,
    lineHeight: 19,
    color: '#687572'
  },
  notificationMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  typeChip: {
    fontSize: 12,
    fontWeight: '800'
  },
  timeText: {
    fontSize: 12,
    color: '#8A9894',
    fontWeight: '600'
  },
  centerState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  centerText: {
    marginTop: 12,
    color: '#687572',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginBottom: 14
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#182C2A',
    textAlign: 'center',
    marginBottom: 6
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8A9894',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#005C55'
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});
