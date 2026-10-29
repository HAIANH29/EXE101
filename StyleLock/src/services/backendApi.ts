import { File as FileSystemFile } from 'expo-file-system';
import { Platform } from 'react-native';
import { Booking,BookingStatus, GenderCategory, Hairstyle, NotificationItem, Payment, PaymentStatus, PaymentType, Salon, ServiceItem, StylistItem } from '../types';
import { ApiError, apiRequest, authSessionStore } from './apiClient';

type PageResponse<T> = {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

type BackendLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: BackendUser;
};

type BackendUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  roles?: string[];
  createdAt?: string;
};

type BackendCategory = {
  id: number;
  name: string;
  description?: string;
};

export type BackendAvailability = {
  salonId: number;
  stylistId: number;
  date: string;
  closed: boolean;
  openTime?: string;
  closeTime?: string;
  bookedIntervals: { startAt: string; endAt: string }[];
};

export type DashboardOverview = {
  totalUsers: number;
  newUsersThisMonth: number;
  totalSalons: number;
  activeSalons: number;
  pendingApprovalSalons: number;
  totalBookingsThisMonth: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenueThisMonth: number | string;
};

type BackendHairstyle = {
  id: number;
  categoryId?: number;
  name: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  gender?: string;
  status?: string;
};

type BackendSalon = {
  id: number;
  ownerId?: number;
  name: string;
  phone?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  geoapifyPlaceId?: string;
  latitude?: number;
  longitude?: number;
  demo?: boolean;
  listingSource?: 'OWNER_SUBMITTED' | 'GEOAPIFY_DEMO' | 'PLATFORM_CURATED';
  sourceProvider?: string;
  sourceUrl?: string;
  sourcePlaceId?: string;
  locationVerifiedAt?: string;
  bookingEnabled?: boolean;
  platformManaged?: boolean;
  businessHoursVerified?: boolean;
};

export type ExternalSalon = {
  placeId: string;
  name: string;
  address?: string;
  phone?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  mapUrl?: string;
  openingHours?: string;
  website?: string;
};

export type SalonSearchLocation = {
  latitude: number;
  longitude: number;
  radius?: number;
};

export type BackendBusinessHour = {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  closed: boolean;
};

export type BackendSalonDetail = BackendSalon & {
  businessHours?: BackendBusinessHour[];
};

type BackendService = {
  id: number;
  salonId: number;
  name: string;
  description?: string;
  price: number | string;
  durationMinutes: number;
  status?: string;
};

type BackendStylist = {
  id: number;
  userId: number;
  fullName?: string;
  avatarUrl?: string;
  salonId: number;
  bio?: string;
  experienceYears?: number;
  status?: string;
};

type BackendBooking = {
  id: number;
  customerId: number;
  salonId: number;
  salonName?: string;
  salonAddress?: string;
  stylistId: number;
  stylistName?: string;
  serviceId: number;
  serviceName?: string;
  hairstyleId?: number;
  hairstyleName?: string;
  startAt: string;
  endAt?: string;
  status: BookingStatus;
  totalAmount?: number | string;
  note?: string;
  createdAt?: string;
};

type BackendPayment = {
  id: number;
  bookingId?: number;
  salonId?: number;
  paymentType?: string;
  serviceAmount?: number | string;
  feeAmount?: number | string;
  provider?: string;
  transactionId?: string;
  referenceCode?: string;
  amount: number | string;
  status: string;
  paymentUrl?: string;
  paidAt?: string;
  createdAt?: string;
  refundAmount?: number | string;
  refundReason?: string;
  refundReference?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
};

type BackendNotification = {
  id: number;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export type BackendReviewSummary = {
  salonId: number;
  averageRating: number | string;
  totalReviews: number;
};

export type BackendReview = {
  id: number;
  bookingId: number;
  customerId: number;
  salonId: number;
  rating: number;
  comment?: string;
  createdAt: string;
};

type BookingContext = {
  salon?: Salon;
  service?: ServiceItem;
  hairstyle?: Hairstyle;
  payment?: BackendPayment;
  userPhotoUri?: string;
};

type AvatarUploadInput = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600';

function moneyToNumber(value: number | string | undefined): number {
  if (value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function mapGender(gender?: string): GenderCategory {
  if (gender === 'FEMALE') return 'nu';
  if (gender === 'UNISEX') return 'unisex';
  return 'nam';
}

function toDisplayTime(isoDate: string) {
  const date = new Date(isoDate);
  const vietnamDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    date: vietnamDate.toISOString().slice(0, 10),
    timeSlot: vietnamDate.toISOString().slice(11, 16)
  };
}

function formatBusinessHours(hours?: BackendBusinessHour[]) {
  if (!hours || hours.length === 0) return 'Liên hệ salon';

  const openDays = hours.filter((hour) => !hour.closed);
  if (openDays.length === 0) return 'Tạm đóng cửa';
  const hasFullWeek = new Set(hours.map((hour) => hour.dayOfWeek)).size === 7;
  const scheduleSignatures = new Set(hours.map((hour) =>
    hour.closed
      ? 'CLOSED'
      : `${hour.openTime?.slice(0, 5) || 'UNKNOWN'}-${hour.closeTime?.slice(0, 5) || 'UNKNOWN'}`));
  const onlySignature = scheduleSignatures.size === 1 ? [...scheduleSignatures][0] : undefined;
  if (!hasFullWeek || !onlySignature || onlySignature.includes('UNKNOWN')) {
    return 'Xem lịch mở cửa chi tiết';
  }

  const first = openDays[0];
  return `Mỗi ngày ${first.openTime?.slice(0, 5)} - ${first.closeTime?.slice(0, 5)}`;
}

function formatPriceRange(services: ServiceItem[]) {
  const validPrices = services.map((service) => service.price).filter((p) => p > 0);
  if (validPrices.length === 0) return 'Liên hệ';

  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);

  const short = (value: number) => `${Math.round(value / 1000)}k`;
  return min === max ? short(min) : `${short(min)} - ${short(max)}`;
}

function mapHairstyle(item: BackendHairstyle, categories: Map<number, string> = new Map()): Hairstyle {
  return {
    id: `api-hs-${item.id}`,
    apiId: item.id,
    name: item.name,
    category: (item.categoryId && categories.get(item.categoryId)) || 'StyleLock',
    gender: mapGender(item.gender),
    imageUrl: item.imageUrl || FALLBACK_IMAGE,
    imageUrls: item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : undefined,
    description: item.description || '',
    suitableFace: 'Tư vấn trực tiếp tại salon'
  };
}

function mapService(item: BackendService): ServiceItem {
  return {
    id: `api-srv-${item.id}`,
    apiId: item.id,
    name: item.name,
    description: item.description,
    price: moneyToNumber(item.price),
    durationMinutes: item.durationMinutes
  };
}

function mapStylist(item: BackendStylist): StylistItem {
  return {
    id: `api-st-${item.id}`,
    apiId: item.id,
    name: item.fullName || `Stylist #${item.id}`,
    role: item.bio || (item.experienceYears ? `${item.experienceYears} năm kinh nghiệm` : undefined),
    avatar: item.avatarUrl
  };
}

function mapSalon(
  item: BackendSalon,
  services: ServiceItem[] = [],
  hairstyles: Hairstyle[] = [],
  stylists: StylistItem[] = [],
  detail?: BackendSalonDetail,
  reviewSummary?: BackendReviewSummary,
  distanceKm?: number
): Salon {
  const rating = Number(reviewSummary?.averageRating || 0);
  const validPrices = services.map((s) => s.price).filter((p) => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : undefined;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : undefined;
  const hasCoordinates = item.latitude !== undefined && item.longitude !== undefined;

  return {
    id: `api-sal-${item.id}`,
    apiId: item.id,
    name: item.name,
    address: item.address || 'Chưa cập nhật địa chỉ',
    distance: distanceKm === undefined ? (hasCoordinates ? 'Xem trên bản đồ' : 'Chưa có tọa độ') : `${distanceKm} km`,
    distanceKm,
    rating: rating > 0 ? Number(rating.toFixed(1)) : 0,
    reviewCount: reviewSummary?.totalReviews || 0,
    priceRange: formatPriceRange(services),
    minPrice,
    maxPrice,
    phone: item.phone || '',
    imageUrl: item.imageUrl || '',
    openingHours: formatBusinessHours(detail?.businessHours),
    supportedHairstyles: hairstyles.map((hair) => hair.id),
    services,
    stylists,
    description: item.description,
    mapUrl: item.listingSource === 'PLATFORM_CURATED' && item.sourceUrl
      ? item.sourceUrl
      : hasCoordinates
        ? `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=18/${item.latitude}/${item.longitude}`
        : item.sourceUrl,
    latitude: item.latitude,
    longitude: item.longitude,
    bookingEligible: item.status === 'ACTIVE'
      && item.bookingEnabled === true
      && services.length > 0
      && stylists.length > 0,
    bookingEnabled: item.bookingEnabled === true,
    status: item.status,
    demo: item.demo,
    externalPlaceId: item.geoapifyPlaceId || item.sourcePlaceId,
    listingSource: item.listingSource,
    sourceProvider: item.sourceProvider,
    sourceUrl: item.sourceUrl,
    sourcePlaceId: item.sourcePlaceId,
    locationVerifiedAt: item.locationVerifiedAt,
    platformManaged: item.platformManaged,
    businessHoursVerified: item.businessHoursVerified
  };
}

function calculateDistanceKm(origin: SalonSearchLocation | undefined, salon: BackendSalon) {
  if (!origin || salon.latitude === undefined || salon.longitude === undefined) return undefined;
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLat = toRadians(salon.latitude - origin.latitude);
  const deltaLon = toRadians(salon.longitude - origin.longitude);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(origin.latitude)) * Math.cos(toRadians(salon.latitude))
    * Math.sin(deltaLon / 2) ** 2;
  return Number((earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

function normalizeSalonName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isSameCuratedPlace(partner: Salon, external: ExternalSalon) {
  if (partner.listingSource !== 'PLATFORM_CURATED'
      || partner.latitude === undefined
      || partner.longitude === undefined) {
    return false;
  }
  const partnerName = normalizeSalonName(partner.name);
  const externalName = normalizeSalonName(external.name);
  const namesMatch = partnerName === externalName
    || (partnerName.length >= 8 && externalName.includes(partnerName))
    || (externalName.length >= 8 && partnerName.includes(externalName));
  if (!namesMatch) return false;

  const distanceKm = calculateDistanceKm(
    { latitude: external.latitude, longitude: external.longitude },
    { id: partner.apiId || 0, name: partner.name, latitude: partner.latitude, longitude: partner.longitude }
  );
  return distanceKm !== undefined && distanceKm <= 0.25;
}

function mapExternalSalon(item: ExternalSalon): Salon {
  const distanceKm = item.distanceMeters === undefined
    ? undefined
    : Number((item.distanceMeters / 1000).toFixed(1));

  return {
    id: `external-${item.placeId}`,
    name: item.name,
    address: item.address || 'Địa chỉ đang cập nhật',
    distance: distanceKm === undefined ? 'Xem trên bản đồ' : `${distanceKm} km`,
    distanceKm,
    rating: 0,
    reviewCount: 0,
    priceRange: 'Liên hệ',
    phone: item.phone || '',
    imageUrl: '',
    openingHours: item.openingHours || 'Xem giờ mở cửa trên bản đồ',
    supportedHairstyles: [],
    services: [],
    stylists: [],
    isExternal: true,
    mapUrl: item.mapUrl,
    website: item.website,
    latitude: item.latitude,
    longitude: item.longitude,
    bookingEligible: false,
    externalPlaceId: item.placeId
  };
}

function mapBooking(item: BackendBooking, context: BookingContext = {}): Booking {
  const dateInfo = toDisplayTime(item.startAt);
  const user = authSessionStore.get()?.user;
  const isOwnBooking = !!user && user.id === item.customerId;

  return {
    id: String(item.id),
    apiId: item.id,
    customerName: isOwnBooking ? user?.fullName || 'Khách StyleLock' : `Khách #${item.customerId}`,
    customerPhone: isOwnBooking ? user?.phone || '' : '',
    salonId: context.salon?.id || `api-sal-${item.salonId}`,
    salonName: item.salonName || context.salon?.name || `Salon #${item.salonId}`,
    salonAddress: item.salonAddress || context.salon?.address || '',
    hairstyleId: context.hairstyle?.id || (item.hairstyleId ? `api-hs-${item.hairstyleId}` : undefined),
    hairstyleName: item.hairstyleName || context.hairstyle?.name,
    tryOnImageUrl: context.userPhotoUri || context.hairstyle?.imageUrl,
    serviceId: context.service?.id || `api-srv-${item.serviceId}`,
    serviceName: item.serviceName || context.service?.name,
    stylistId: item.stylistId ? `api-st-${item.stylistId}` : undefined,
    stylistName: item.stylistName,
    date: dateInfo.date,
    timeSlot: dateInfo.timeSlot,
    status: item.status,
    createdAt: item.createdAt || new Date().toISOString(),
    totalPrice: moneyToNumber(item.totalAmount),
    qrCode: context.payment?.referenceCode || `STYLELOCK-${item.id}`
  };
}

function readQueryParam(url: string | undefined, name: string) {
  if (!url) return undefined;
  const match = url.match(new RegExp(`[?&]${name}=([^&]*)`));
  return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : undefined;
}

function optionalMoney(value: number | string | undefined | null) {
  return value === undefined || value === null ? undefined : moneyToNumber(value);
}

function mapPayment(item: BackendPayment): Payment {
  return {
    id: item.id,
    bookingId: item.bookingId ?? undefined,
    salonId: item.salonId ?? undefined,
    type: (item.paymentType as PaymentType) || 'BOOKING_CONNECTION',
    serviceAmount: moneyToNumber(item.serviceAmount),
    feeAmount: moneyToNumber(item.feeAmount),
    amount: moneyToNumber(item.amount),
    status: item.status as PaymentStatus,
    provider: item.provider || undefined,
    referenceCode: item.referenceCode || '',
    qrUrl: item.paymentUrl || undefined,
    bankCode: readQueryParam(item.paymentUrl, 'bank'),
    bankAccount: readQueryParam(item.paymentUrl, 'acc'),
    transferContent: readQueryParam(item.paymentUrl, 'des'),
    transactionId: item.transactionId || undefined,
    paidAt: item.paidAt || undefined,
    createdAt: item.createdAt || '',
    refundAmount: optionalMoney(item.refundAmount),
    refundReason: item.refundReason || undefined,
    refundReference: item.refundReference || undefined,
    refundRequestedAt: item.refundRequestedAt || undefined,
    refundedAt: item.refundedAt || undefined
  };
}

function mapNotification(item: BackendNotification): NotificationItem {
  return {
    id: item.id,
    type: item.type as NotificationItem['type'],
    title: item.title,
    content: item.content,
    read: item.read,
    createdAt: item.createdAt
  };
}

function buildStartAt(date: string, timeSlot: string) {
  return new Date(`${date}T${timeSlot}:00+07:00`).toISOString();
}

let categoryCache: Map<number, string> | undefined;

async function getCategoryMap(): Promise<Map<number, string>> {
  if (categoryCache) return categoryCache;
  try {
    const items = await apiRequest<BackendCategory[]>('/api/catalog/hairstyle-categories');
    categoryCache = new Map(items.map((item) => [item.id, item.name]));
  } catch {
    return new Map();
  }
  return categoryCache;
}

async function getPage<T>(path: string): Promise<T[]> {
  const page = await apiRequest<PageResponse<T>>(path);
  return page.content || [];
}

function inferAvatarMimeType(input: AvatarUploadInput) {
  if (input.mimeType) return input.mimeType;
  const value = (input.fileName || input.uri).toLowerCase();
  if (value.endsWith('.png')) return 'image/png';
  if (value.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function inferAvatarFileName(input: AvatarUploadInput) {
  if (input.fileName) return input.fileName;
  const mimeType = inferAvatarMimeType(input);
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `avatar-${Date.now()}.${extension}`;
}

async function appendImageToFormData(
  formData: FormData,
  fieldName: string,
  uri: string,
  fileName: string,
  mimeType: string
) {
  // `window` cũng tồn tại trên React Native nên phải dùng Platform
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    const blob = await (await fetch(uri)).blob();
    const file = new File([blob], fileName, { type: mimeType || blob.type || 'image/jpeg' });
    formData.append(fieldName, file);
    return;
  }

  // fetch toàn cục của Expo (expo/fetch) không nhận part {uri,name,type} của React Native:
  // nó chỉ nhận chuỗi, Blob hoặc object có bytes() -> tự đọc byte rồi đưa part dạng đó.
  const bytes = /^(https?|data):/i.test(uri)
    ? new Uint8Array(await (await fetch(uri)).arrayBuffer())
    : await new FileSystemFile(uri).bytes();
  formData.append(fieldName, {
    name: fileName,
    type: mimeType,
    bytes: async () => bytes
  } as unknown as Blob);
}

export const backendApi = {
  isAuthenticated: authSessionStore.isAuthenticated,
  getCurrentUser: authSessionStore.get,

  async validateSession() {
    if (!authSessionStore.isAuthenticated()) {
      return false;
    }

    try {
      await this.getMe();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        authSessionStore.clear('expired');
        return false;
      }
      return true;
    }
  },

  async getMe() {
    const user = await apiRequest<BackendUser>('/api/auth/me');
    const session = authSessionStore.get();
    if (session) {
      authSessionStore.set({ ...session, user });
    }
    return user;
  },

  async updateProfile(input: { fullName: string; phone?: string }) {
    const user = await apiRequest<BackendUser>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
    const session = authSessionStore.get();
    if (session) {
      authSessionStore.set({ ...session, user });
    }
    return user;
  },

  async uploadAvatar(input: AvatarUploadInput) {
    const formData = new FormData();
    const fileName = inferAvatarFileName(input);
    const mimeType = inferAvatarMimeType(input);

    await appendImageToFormData(formData, 'file', input.uri, fileName, mimeType);

    const user = await apiRequest<BackendUser>('/api/auth/me/avatar', {
      method: 'POST',
      body: formData
    });
    const session = authSessionStore.get();
    if (session) {
      authSessionStore.set({ ...session, user });
    }
    return user;
  },

  async login(email: string, password: string) {
    const session = await apiRequest<BackendLoginResponse>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password })
    });
    authSessionStore.set(session);
    return session;
  },

  async sendRegisterOtp(input: { email: string }) {
    return apiRequest<void>('/api/auth/register/send-otp', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: input.email })
    });
  },

  async verifyRegisterOtp(input: { email: string; otp: string }) {
    return apiRequest<void>('/api/auth/register/verify-otp', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input)
    });
  },

  async register(input: { email: string; password: string; fullName: string; phone?: string }) {
    const session = await apiRequest<BackendLoginResponse>('/api/auth/register', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input)
    });
    authSessionStore.set(session);
    return session;
  },

  async requestPasswordReset(input: { email: string }) {
    return apiRequest<void>('/api/auth/forgot-password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email: input.email })
    });
  },

  async resetPassword(input: { token: string; newPassword: string }) {
    return apiRequest<void>('/api/auth/reset-password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input)
    });
  },

  async changePassword(input: { oldPassword: string; newPassword: string }) {
    return apiRequest<void>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async logout() {
    const refreshToken = authSessionStore.get()?.refreshToken;
    authSessionStore.clear();
    if (!refreshToken) return;

    try {
      await apiRequest<void>('/api/auth/logout', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ refreshToken })
      });
    } catch {
      // Local logout should still succeed when the backend is unavailable.
    }
  },

  async deleteAccount() {
    await apiRequest<void>('/api/auth/me', {
      method: 'DELETE'
    });
    authSessionStore.clear();
  },

  async getNotifications(page = 0, size = 30) {
    const items = await getPage<BackendNotification>(`/api/notifications?page=${page}&size=${size}`);
    return items.map(mapNotification);
  },

  async getUnreadNotificationCount() {
    return apiRequest<number>('/api/notifications/unread-count');
  },

  async markNotificationAsRead(notificationId: number) {
    return apiRequest<void>(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  },

  async markAllNotificationsAsRead() {
    return apiRequest<void>('/api/notifications/read-all', {
      method: 'PATCH'
    });
  },

  async getHairstyles() {
    const [items, categories] = await Promise.all([
      getPage<BackendHairstyle>('/api/catalog/hairstyles?size=100'),
      getCategoryMap()
    ]);
    return items.map((item) => mapHairstyle(item, categories));
  },

  async getServicesBySalon(salonId: number) {
    const items = await getPage<BackendService>(`/api/salons/${salonId}/services?size=100`);
    return items.map(mapService);
  },

  async getStylistsBySalon(salonId: number) {
    const items = await getPage<BackendStylist>(`/api/salons/${salonId}/stylists?size=100`);
    return items.map(mapStylist);
  },

  async getHairstylesBySalon(salonId: number) {
    const [items, categories] = await Promise.all([
      apiRequest<BackendHairstyle[]>(`/api/salons/${salonId}/hairstyles`),
      getCategoryMap()
    ]);
    return items.map((item) => mapHairstyle(item, categories));
  },

  async getSalons(location?: SalonSearchLocation, query?: string) {
    const locationParams = new URLSearchParams();
    if (query?.trim()) {
      locationParams.set('query', query.trim());
    } else if (location) {
      locationParams.set('latitude', String(location.latitude));
      locationParams.set('longitude', String(location.longitude));
      locationParams.set('radius', String(location.radius || 10000));
    }
    const locationQuery = locationParams.size ? `?${locationParams.toString()}` : '';

    const [items, externalItems] = await Promise.all([
      getPage<BackendSalon>('/api/salons?status=ACTIVE&size=100'),
      apiRequest<ExternalSalon[]>(`/api/public/salons/nearby${locationQuery}`).catch(() => [])
    ]);

    const partnerSalons = await Promise.all(
      items.map(async (salon) => {
        const [services, hairstyles, stylists, detail, reviewSummary] = await Promise.all([
          this.getServicesBySalon(salon.id).catch(() => []),
          this.getHairstylesBySalon(salon.id).catch(() => []),
          this.getStylistsBySalon(salon.id).catch(() => []),
          this.getSalonDetail(salon.id).catch(() => undefined),
          this.getSalonReviewSummary(salon.id).catch(() => undefined)
        ]);

        return mapSalon(
          salon,
          services,
          hairstyles,
          stylists,
          detail,
          reviewSummary,
          calculateDistanceKm(location, salon)
        );
      })
    );

    const partnersByPlaceId = new Map(
      partnerSalons
        .map((salon, index) => [items[index]?.geoapifyPlaceId, salon] as const)
        .filter(([placeId]) => Boolean(placeId))
    );
    const matchedPartnerIds = new Set<number>();
    const nearbySalons = externalItems.map((external) => {
      const partner = partnersByPlaceId.get(external.placeId)
        || partnerSalons.find((candidate) =>
          (!candidate.apiId || !matchedPartnerIds.has(candidate.apiId))
          && isSameCuratedPlace(candidate, external));
      if (!partner) return mapExternalSalon(external);
      if (partner.apiId) matchedPartnerIds.add(partner.apiId);
      const distanceKm = external.distanceMeters === undefined
        ? partner.distanceKm
        : Number((external.distanceMeters / 1000).toFixed(1));
      return {
        ...partner,
        distanceKm,
        distance: distanceKm === undefined ? partner.distance : `${distanceKm} km`,
        mapUrl: partner.listingSource === 'PLATFORM_CURATED' && partner.sourceUrl
          ? partner.sourceUrl
          : external.mapUrl || partner.mapUrl,
        website: external.website || partner.website,
        latitude: external.latitude,
        longitude: external.longitude,
        externalPlaceId: partner.externalPlaceId || external.placeId
      };
    });
    const normalizedQuery = query?.trim() ? normalizeSalonName(query) : undefined;
    const remainingPartners = partnerSalons.filter((partner) => {
      if (partner.apiId && matchedPartnerIds.has(partner.apiId)) return false;
      if (!normalizedQuery) return true;
      return normalizeSalonName(`${partner.name} ${partner.address}`).includes(normalizedQuery);
    });

    return [...nearbySalons, ...remainingPartners];
  },

  async searchGeoapifySalons(query: string) {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      throw new Error('Nhập ít nhất 2 ký tự địa điểm hoặc tên salon.');
    }
    return apiRequest<ExternalSalon[]>(
      `/api/public/salons/nearby?query=${encodeURIComponent(normalizedQuery)}&radius=10000`
    );
  },

  async registerOwnerSalonFromGeoapify(place: ExternalSalon) {
    const item = await apiRequest<BackendSalon>('/api/salons', {
      method: 'POST',
      body: JSON.stringify({
        name: place.name,
        phone: place.phone,
        address: place.address,
        geoapifyPlaceId: place.placeId,
        latitude: place.latitude,
        longitude: place.longitude
      })
    });
    return mapSalon(item);
  },

  async getSalonDetail(salonId: number) {
    return apiRequest<BackendSalonDetail>(`/api/salons/${salonId}`);
  },

  async materializeDemoSalon(salon: Salon) {
    if (!salon.externalPlaceId || salon.latitude === undefined || salon.longitude === undefined) {
      throw new Error('Salon Geoapify thiếu placeId hoặc tọa độ.');
    }
    const item = await apiRequest<BackendSalon>('/api/demo/salons/materialize', {
      method: 'POST',
      body: JSON.stringify({
        placeId: salon.externalPlaceId,
        name: salon.name,
        address: salon.address,
        phone: salon.phone,
        latitude: salon.latitude,
        longitude: salon.longitude
      })
    });
    const [services, hairstyles, stylists, detail, reviewSummary] = await Promise.all([
      this.getServicesBySalon(item.id),
      this.getHairstylesBySalon(item.id).catch(() => []),
      this.getStylistsBySalon(item.id),
      this.getSalonDetail(item.id),
      this.getSalonReviewSummary(item.id).catch(() => undefined)
    ]);
    return mapSalon(item, services, hairstyles, stylists, detail, reviewSummary);
  },

  async getSalonReviewSummary(salonId: number) {
    return apiRequest<BackendReviewSummary>(`/api/salons/${salonId}/reviews/summary`);
  },

  async getSalonReviews(salonId: number, page = 0, size = 50) {
    const result = await apiRequest<PageResponse<BackendReview>>(
      `/api/salons/${salonId}/reviews?page=${page}&size=${size}`
    );
    return {
      items: result.content || [],
      total: result.totalElements || 0,
      totalPages: result.totalPages || 0,
      last: result.last ?? true
    };
  },

  async createReview(input: { bookingId: number; rating: number; comment?: string }) {
    return apiRequest<BackendReview>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async getPaymentByBooking(bookingId: string | number) {
    return apiRequest<BackendPayment>(`/api/bookings/${bookingId}/payment`);
  },

  async getBookingPayment(bookingId: string | number) {
    return mapPayment(await this.getPaymentByBooking(bookingId));
  },

  async getPayment(paymentId: number) {
    return mapPayment(await apiRequest<BackendPayment>(`/api/payments/${paymentId}`));
  },

  async confirmDemoPayment(paymentId: number) {
    return mapPayment(await apiRequest<BackendPayment>(`/api/demo/payments/${paymentId}/confirm`, {
      method: 'POST'
    }));
  },

  async getPaymentHistory(page = 0, size = 20) {
    const result = await apiRequest<PageResponse<BackendPayment>>(`/api/payments/history?page=${page}&size=${size}`);
    return {
      items: (result.content || []).map(mapPayment),
      hasMore: !result.last
    };
  },

  async createBooking(input: {
    salon: Salon;
    service: ServiceItem;
    stylist: StylistItem;
    selectedDate: string;
    selectedTimeSlot: string;
    hairstyle?: Hairstyle;
    userPhotoUri?: string;
    note?: string;
  }) {
    if (!input.salon.apiId || !input.service.apiId || !input.stylist.apiId) {
      throw new Error('Missing backend ids for salon, service, or stylist.');
    }

    const booking = await apiRequest<BackendBooking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        salonId: input.salon.apiId,
        stylistId: input.stylist.apiId,
        serviceId: input.service.apiId,
        hairstyleId: input.hairstyle?.apiId,
        startAt: buildStartAt(input.selectedDate, input.selectedTimeSlot),
        note: input.note
      })
    });

    let payment: BackendPayment | undefined;
    try {
      payment = await this.getPaymentByBooking(booking.id);
    } catch {
      payment = undefined;
    }

    return mapBooking(booking, {
      salon: input.salon,
      service: input.service,
      hairstyle: input.hairstyle,
      payment,
      userPhotoUri: input.userPhotoUri
    });
  },

  async getMyBookings() {
    const items = await getPage<BackendBooking>('/api/bookings/me?size=100');
    return items.map((item) => mapBooking(item));
  },

  async getBookingDetail(bookingId: string) {
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}`);
    const payment = await this.getPaymentByBooking(booking.id).catch(() => undefined);
    return mapBooking(booking, { payment });
  },

  async cancelBooking(bookingId: string, reason?: string) {
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: reason ? JSON.stringify({ reason }) : undefined
    });
    return mapBooking(booking);
  },

  async rescheduleBooking(bookingId: string | number, date: string, timeSlot: string) {
    const startAt = buildStartAt(date, timeSlot);
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ startAt })
    });
    return mapBooking(booking);
  },

  async getAvailability(salonId: number, stylistId: number, date: string) {
    return apiRequest<BackendAvailability>(
      `/api/bookings/salon/${salonId}/stylists/${stylistId}/availability?date=${date}`
    );
  },

  hasRole(role: string) {
    return !!authSessionStore.get()?.user?.roles?.includes(role);
  },

  async getMySalons() {
    const items = await getPage<BackendSalon>('/api/salons/my-salons?size=50');
    return items.map((item) => mapSalon(item));
  },

  async getSalonBookings(salonId: number) {
    const items = await getPage<BackendBooking>(`/api/bookings/salon/${salonId}?size=100`);
    return items.map((item) => mapBooking(item));
  },

  async confirmBooking(bookingId: string | number) {
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}/confirm`, { method: 'PATCH' });
    return mapBooking(booking);
  },

  async completeBooking(bookingId: string | number) {
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}/complete`, { method: 'PATCH' });
    return mapBooking(booking);
  },

  async getDashboardOverview() {
    return apiRequest<DashboardOverview>('/api/dashboard/overview');
  },

  async generateTryOn(input: {
    imageUri: string;
    hairstyleId: number;
    hairImageUrl?: string;
    colorImageUrl?: string;
    fileName?: string;
    mimeType?: string;
  }) {
    const formData = new FormData();
    const fileName = inferAvatarFileName({ uri: input.imageUri, fileName: input.fileName, mimeType: input.mimeType });
    const mimeType = inferAvatarMimeType({ uri: input.imageUri, fileName: input.fileName, mimeType: input.mimeType });

    // If input.imageUri is already an online HTTP/HTTPS URL, send imageUrl field as well
    if (input.imageUri.startsWith('http://') || input.imageUri.startsWith('https://')) {
      formData.append('imageUrl', input.imageUri);
    }

    await appendImageToFormData(formData, 'image', input.imageUri, fileName, mimeType);

    formData.append('hairstyleId', String(input.hairstyleId));
    if (input.hairImageUrl) {
      formData.append('hairImageUrl', input.hairImageUrl);
    }
    if (input.colorImageUrl) {
      formData.append('colorImageUrl', input.colorImageUrl);
    }

    return apiRequest<{
      requestId: number;
      userId?: number;
      hairstyleId: number;
      inputImageUrl: string;
      resultImageUrl: string;
      status: string;
    }>('/api/tryon', {
      method: 'POST',
      body: formData
    });
  },

  async regenerateTryOn(requestId: number) {
    return apiRequest<{
      requestId: number;
      userId?: number;
      hairstyleId: number;
      inputImageUrl: string;
      resultImageUrl: string;
      status: string;
    }>(`/api/tryon/${requestId}/regenerate`, {
      method: 'POST'
    });
  }
};

