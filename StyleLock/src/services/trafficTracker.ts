import { Platform } from 'react-native';
import { API_BASE_URL } from './apiClient';

/**
 * Ghi nhận nguồn truy cập (UTM - Urchin Tracking Module) khi người dùng mở web.
 *
 * UTM là các tham số gắn sau URL, ví dụ:
 *   https://stylelock-web.vercel.app/?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale
 * Mỗi phiên trình duyệt chỉ gửi 1 lần. Lỗi mạng bị bỏ qua để không ảnh hưởng trải nghiệm.
 */

const SESSION_KEY = 'stylelock.traffic.session';
const SENT_KEY = 'stylelock.traffic.sent';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage có thể bị chặn (private mode) -> bỏ qua
  }
}

function getSessionId() {
  let id = readSession(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    writeSession(SESSION_KEY, id);
  }
  return id;
}

/**
 * Google Analytics 4 (tuỳ chọn): chỉ bật khi đặt EXPO_PUBLIC_GA_MEASUREMENT_ID (dạng G-XXXXXXXXXX).
 * GA4 tự đọc utm_* trên URL để gán nguồn / chiến dịch, không cần code thêm.
 */
function loadGa4() {
  const measurementId = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) return;
  const w = window as any;
  if (w.__ga4Loaded) return;
  w.__ga4Loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag yêu cầu đẩy đúng đối tượng `arguments`
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', measurementId);
}

export function trackVisit() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  loadGa4();
  if (readSession(SENT_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });

  writeSession(SENT_KEY, '1');

  void fetch(`${API_BASE_URL}/api/public/analytics/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: getSessionId(),
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign,
      utmTerm: utm.utm_term,
      utmContent: utm.utm_content,
      landingPath: window.location.pathname,
      referrer: document.referrer || undefined
    }),
    keepalive: true
  }).catch(() => undefined);
}
