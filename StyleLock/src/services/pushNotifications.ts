import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiRequest } from './apiClient';

/**
 * Thông báo đẩy (hiện ngoài màn hình điện thoại) qua Expo Push. Chỉ chạy trên app native
 * (Android/iOS thật); web và máy ảo bỏ qua. Mọi lỗi chỉ ghi log, không làm hỏng app.
 *
 * Lưu ý: Expo Go trên Android không nhận push từ xa, cần bản build (APK / development build)
 * đã cấu hình FCM trong EAS.
 */

let registeredToken: string | null = null;

const isNativeDevice = () => Platform.OS !== 'web' && Device.isDevice;

/** Cách hiển thị thông báo khi app đang mở: vẫn hiện banner và phát tiếng. */
export function configurePushHandling(onOpen: () => void) {
  if (Platform.OS === 'web') return () => undefined;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });

  const subscription = Notifications.addNotificationResponseReceivedListener(() => onOpen());

  // App được mở từ lúc đã tắt hẳn bằng cách bấm vào thông báo
  void Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) onOpen();
    })
    .catch(() => undefined);

  return () => subscription.remove();
}

/** Xin quyền, lấy Expo push token và gửi lên backend cho tài khoản đang đăng nhập. */
export async function registerForPush(): Promise<void> {
  if (!isNativeDevice()) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Lịch hẹn & thông báo',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B8895A'
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await apiRequest<void>('/api/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS })
    });
    registeredToken = token;
  } catch (error) {
    console.warn('Không đăng ký được thông báo đẩy', error);
  }
}

/** Gọi TRƯỚC khi xóa phiên đăng nhập để máy không còn nhận thông báo của tài khoản cũ. */
export async function unregisterPush(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;

  try {
    await apiRequest<void>('/api/notifications/push-token', {
      method: 'DELETE',
      body: JSON.stringify({ token })
    });
  } catch {
    // Đăng xuất cục bộ vẫn phải thành công khi backend không phản hồi.
  }
}
