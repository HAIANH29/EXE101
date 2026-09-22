import { Booking, BookingStatus, GenderCategory, Hairstyle, Salon, ServiceItem, StylistItem } from '../types';
import { apiRequest, authSessionStore } from './apiClient';

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
};

type BackendHairstyle = {
  id: number;
  categoryId?: number;
  name: string;
  description?: string;
  imageUrl?: string;
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
};

type BackendBusinessHour = {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  closed: boolean;
};

type BackendSalonDetail = BackendSalon & {
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
  bookingId: number;
  referenceCode?: string;
  amount: number | string;
  status: string;
  paymentUrl?: string;
};

type BackendReviewSummary = {
  salonId: number;
  averageRating: number | string;
  totalReviews: number;
};

type BookingContext = {
  salon?: Salon;
  service?: ServiceItem;
  hairstyle?: Hairstyle;
  payment?: BackendPayment;
  userPhotoUri?: string;
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

  const openDays = hours.filter((hour) => !hour.closed && hour.openTime && hour.closeTime);
  if (openDays.length === 0) return 'Tạm đóng cửa';

  const first = openDays[0];
  return `${first.openTime?.slice(0, 5)} - ${first.closeTime?.slice(0, 5)}`;
}

function formatPriceRange(services: ServiceItem[]) {
  if (services.length === 0) return 'Liên hệ';

  const prices = services.map((service) => service.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  const short = (value: number) => `${Math.round(value / 1000)}k`;
  return min === max ? short(min) : `${short(min)} - ${short(max)}`;
}

function mapHairstyle(item: BackendHairstyle): Hairstyle {
  return {
    id: `api-hs-${item.id}`,
    apiId: item.id,
    name: item.name,
    category: item.categoryId ? `Category ${item.categoryId}` : 'StyleLock',
    gender: mapGender(item.gender),
    imageUrl: item.imageUrl || FALLBACK_IMAGE,
    description: item.description || 'Kiểu tóc từ catalog backend StyleLock.',
    suitableFace: 'Tư vấn trực tiếp tại salon',
    tag: item.status === 'ACTIVE' ? 'Backend' : item.status
  };
}

function mapService(item: BackendService): ServiceItem {
  return {
    id: `api-srv-${item.id}`,
    apiId: item.id,
    name: item.name,
    price: moneyToNumber(item.price),
    durationMinutes: item.durationMinutes
  };
}

function mapStylist(item: BackendStylist): StylistItem {
  return {
    id: `api-st-${item.id}`,
    apiId: item.id,
    name: item.fullName || `Stylist #${item.id}`,
    role: item.bio || `${item.experienceYears || 0} năm kinh nghiệm`,
    avatar: item.avatarUrl
  };
}

function mapSalon(
  item: BackendSalon,
  services: ServiceItem[] = [],
  hairstyles: Hairstyle[] = [],
  stylists: StylistItem[] = [],
  detail?: BackendSalonDetail,
  reviewSummary?: BackendReviewSummary
): Salon {
  const rating = Number(reviewSummary?.averageRating || 0);

  return {
    id: `api-sal-${item.id}`,
    apiId: item.id,
    name: item.name,
    address: item.address || 'Chưa cập nhật địa chỉ',
    distance: 'Theo vị trí của bạn',
    rating: rating > 0 ? Number(rating.toFixed(1)) : 0,
    reviewCount: reviewSummary?.totalReviews || 0,
    priceRange: formatPriceRange(services),
    phone: item.phone || '',
    imageUrl: item.imageUrl || FALLBACK_IMAGE,
    openingHours: formatBusinessHours(detail?.businessHours),
    supportedHairstyles: hairstyles.map((hair) => hair.id),
    services,
    stylists
  };
}

function mapBooking(item: BackendBooking, context: BookingContext = {}): Booking {
  const dateInfo = toDisplayTime(item.startAt);
  const user = authSessionStore.get()?.user;

  return {
    id: String(item.id),
    apiId: item.id,
    customerName: user?.fullName || 'Khách StyleLock',
    customerPhone: user?.phone || '',
    salonId: context.salon?.id || `api-sal-${item.salonId}`,
    salonName: item.salonName || context.salon?.name || `Salon #${item.salonId}`,
    salonAddress: item.salonAddress || context.salon?.address || '',
    hairstyleId: context.hairstyle?.id || (item.hairstyleId ? `api-hs-${item.hairstyleId}` : undefined),
    hairstyleName: item.hairstyleName || context.hairstyle?.name,
    tryOnImageUrl: context.userPhotoUri || context.hairstyle?.imageUrl,
    serviceId: context.service?.id || `api-srv-${item.serviceId}`,
    serviceName: item.serviceName || context.service?.name,
    date: dateInfo.date,
    timeSlot: dateInfo.timeSlot,
    status: item.status,
    createdAt: item.createdAt || new Date().toISOString(),
    totalPrice: moneyToNumber(item.totalAmount),
    qrCode: context.payment?.referenceCode || `STYLELOCK-${item.id}`
  };
}

function buildStartAt(date: string, timeSlot: string) {
  return new Date(`${date}T${timeSlot}:00+07:00`).toISOString();
}

async function getPage<T>(path: string): Promise<T[]> {
  const page = await apiRequest<PageResponse<T>>(path);
  return page.content || [];
}

export const backendApi = {
  isAuthenticated: authSessionStore.isAuthenticated,
  getCurrentUser: authSessionStore.get,

  async login(email: string, password: string) {
    const session = await apiRequest<BackendLoginResponse>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password })
    });
    authSessionStore.set(session);
    return session;
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

  async requestPasswordReset(input: { email: string; redirectUrl?: string }) {
    return apiRequest<void>('/api/auth/forgot-password', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input)
    });
  },

  async resetPassword(input: { token: string; newPassword: string }) {
    return apiRequest<void>('/api/auth/reset-password', {
      method: 'POST',
      auth: false,
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

  async getHairstyles() {
    const items = await getPage<BackendHairstyle>('/api/catalog/hairstyles?size=100');
    return items.map(mapHairstyle);
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
    const items = await apiRequest<BackendHairstyle[]>(`/api/salons/${salonId}/hairstyles`);
    return items.map(mapHairstyle);
  },

  async getSalons() {
    const items = await getPage<BackendSalon>('/api/salons?status=ACTIVE&size=100');

    return Promise.all(
      items.map(async (salon) => {
        const [services, hairstyles, stylists, detail, reviewSummary] = await Promise.all([
          this.getServicesBySalon(salon.id).catch(() => []),
          this.getHairstylesBySalon(salon.id).catch(() => []),
          this.getStylistsBySalon(salon.id).catch(() => []),
          this.getSalonDetail(salon.id).catch(() => undefined),
          this.getSalonReviewSummary(salon.id).catch(() => undefined)
        ]);

        return mapSalon(salon, services, hairstyles, stylists, detail, reviewSummary);
      })
    );
  },

  async getSalonDetail(salonId: number) {
    return apiRequest<BackendSalonDetail>(`/api/salons/${salonId}`);
  },

  async getSalonReviewSummary(salonId: number) {
    return apiRequest<BackendReviewSummary>(`/api/salons/${salonId}/reviews/summary`);
  },

  async getPaymentByBooking(bookingId: string | number) {
    return apiRequest<BackendPayment>(`/api/bookings/${bookingId}/payment`);
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
  }
};
