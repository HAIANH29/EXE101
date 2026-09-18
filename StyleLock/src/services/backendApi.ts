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
  stylistId: number;
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

type BookingContext = {
  salon?: Salon;
  service?: ServiceItem;
  hairstyle?: Hairstyle;
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
  return {
    date: date.toISOString().slice(0, 10),
    timeSlot: date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  };
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
    name: `Stylist #${item.id}`,
    role: item.bio || `${item.experienceYears || 0} năm kinh nghiệm`
  };
}

function mapSalon(
  item: BackendSalon,
  services: ServiceItem[] = [],
  hairstyles: Hairstyle[] = [],
  stylists: StylistItem[] = []
): Salon {
  return {
    id: `api-sal-${item.id}`,
    apiId: item.id,
    name: item.name,
    address: item.address || 'Chưa cập nhật địa chỉ',
    distance: 'Theo vị trí của bạn',
    rating: 4.8,
    reviewCount: 0,
    priceRange: formatPriceRange(services),
    phone: item.phone || '',
    imageUrl: item.imageUrl || FALLBACK_IMAGE,
    openingHours: 'Liên hệ salon',
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
    salonAddress: context.salon?.address || '',
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
    qrCode: `STYLELOCK-${item.id}`
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

  logout() {
    authSessionStore.clear();
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
        const [services, hairstyles, stylists] = await Promise.all([
          this.getServicesBySalon(salon.id).catch(() => []),
          this.getHairstylesBySalon(salon.id).catch(() => []),
          this.getStylistsBySalon(salon.id).catch(() => [])
        ]);

        return mapSalon(salon, services, hairstyles, stylists);
      })
    );
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

    return mapBooking(booking, {
      salon: input.salon,
      service: input.service,
      hairstyle: input.hairstyle,
      userPhotoUri: input.userPhotoUri
    });
  },

  async getMyBookings() {
    const items = await getPage<BackendBooking>('/api/bookings/me?size=100');
    return items.map((item) => mapBooking(item));
  },

  async getBookingDetail(bookingId: string) {
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}`);
    return mapBooking(booking);
  },

  async cancelBooking(bookingId: string, reason?: string) {
    const booking = await apiRequest<BackendBooking>(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: reason ? JSON.stringify({ reason }) : undefined
    });
    return mapBooking(booking);
  }
};
