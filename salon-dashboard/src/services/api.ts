import {
  Appointment,
  AuthSession,
  PaymentInfo,
  BusinessHour,
  PageResponse,
  Salon,
  ServiceItem,
  Stylist,
  UserAccount
} from '../types/salon';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AUTH_STORAGE_KEY = 'stylelock.salon.auth.session';

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function readEnvelope<T>(payload: ApiEnvelope<T> | T | undefined): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

let refreshPromise: Promise<AuthSession | null> | null = null;

async function refreshSession(): Promise<AuthSession | null> {
  const session = getStoredSession();
  if (!session?.refreshToken) {
    setStoredSession(null);
    return null;
  }
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
      const text = await response.text();
      const payload = text ? JSON.parse(text) : undefined;
      if (!response.ok) {
        setStoredSession(null);
        return null;
      }
      const data = payload?.data || payload;
      if (!data?.accessToken) {
        setStoredSession(null);
        return null;
      }
      const nextSession: AuthSession = {
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || session.refreshToken,
        tokenType: data.tokenType || session.tokenType || 'Bearer',
        expiresIn: data.expiresIn || session.expiresIn
      };
      setStoredSession(nextSession);
      return nextSession;
    } catch {
      setStoredSession(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { auth = true, ...fetchOptions } = options;
  const session = getStoredSession();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined)
  };

  // FormData (upload file) phải để trình duyệt tự gắn Content-Type kèm boundary
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth && session?.accessToken) {
    headers.Authorization = `${session.tokenType || 'Bearer'} ${session.accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers
  });

  // Tự động làm mới token nếu gặp 401 Unauthorized do token hết hạn
  if (response.status === 401 && auth && session?.refreshToken && path !== '/api/auth/refresh') {
    const refreshed = await refreshSession();
    if (refreshed?.accessToken) {
      headers.Authorization = `${refreshed.tokenType || 'Bearer'} ${refreshed.accessToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers
      });
    }
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T> | T) : undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiEnvelope<T> | undefined;
    if (response.status === 401) setStoredSession(null);
    throw new Error(errorPayload?.message || `Backend returned HTTP ${response.status}`);
  }

  return readEnvelope<T>(payload);
}

export async function page<T>(path: string) {
  const result = await request<PageResponse<T>>(path);
  return result.content || [];
}

export type SalonFormInput = {
  name: string;
  phone?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
};

export type ServiceFormInput = {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
};

export type StylistFormInput = {
  userId: number;
  bio?: string;
  experienceYears?: number;
};

export const salonApi = {
  getStoredSession,

  isAuthenticated() {
    return Boolean(getStoredSession()?.accessToken);
  },

  async login(email: string, password: string) {
    const session = await request<AuthSession>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password })
    });
    setStoredSession(session);
    return session;
  },

  async logout() {
    const session = getStoredSession();
    setStoredSession(null);
    if (!session?.refreshToken) return;

    try {
      await request<void>('/api/auth/logout', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
    } catch {
      // Local logout is enough for the dashboard shell.
    }
  },

  async getMe() {
    const user = await request<UserAccount>('/api/auth/me');
    const session = getStoredSession();
    if (session) setStoredSession({ ...session, user });
    return user;
  },

  async getMySalons() {
    return page<Salon>('/api/salons/my-salons?size=100');
  },

  async getSalonDetail(salonId: number) {
    return request<Salon>(`/api/salons/${salonId}`);
  },

  async createSalon(input: SalonFormInput) {
    return request<Salon>('/api/salons', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async uploadSalonImage(file: File) {
    const body = new FormData();
    body.append('file', file);
    const result = await request<{ url: string }>('/api/salons/images', {
      method: 'POST',
      body
    });
    return result.url;
  },

  async updateSalon(salonId: number, input: SalonFormInput) {
    return request<Salon>(`/api/salons/${salonId}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  },

  async updateBusinessHours(salonId: number, hours: BusinessHour[]) {
    return request<void>(`/api/salons/${salonId}/business-hours`, {
      method: 'PUT',
      body: JSON.stringify(hours)
    });
  },

  async getServices(salonId: number) {
    return page<ServiceItem>(`/api/salons/${salonId}/services?size=100`);
  },

  async createService(salonId: number, input: ServiceFormInput) {
    return request<ServiceItem>(`/api/salons/${salonId}/services`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  async updateService(serviceId: number, input: ServiceFormInput) {
    return request<ServiceItem>(`/api/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  },

  async getStylists(salonId: number) {
    return page<Stylist>(`/api/salons/${salonId}/stylists?size=100`);
  },

  async createStylist(salonId: number, input: StylistFormInput) {
    return request<Stylist>(`/api/salons/${salonId}/stylists`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  subscribePro(salonId: number) {
    return request<PaymentInfo>(`/api/salons/${salonId}/pro/subscribe`, { method: 'POST' });
  },

  getPayment(paymentId: number) {
    return request<PaymentInfo>(`/api/payments/${paymentId}`);
  },

  getPaymentHistory() {
    return page<PaymentInfo>('/api/payments/history?size=50');
  },

  async getSalonBookings(salonId: number) {
    return page<Appointment>(`/api/bookings/salon/${salonId}?size=100`);
  },

  async confirmBooking(bookingId: number) {
    return request<Appointment>(`/api/bookings/${bookingId}/confirm`, {
      method: 'PATCH'
    });
  },

  async completeBooking(bookingId: number) {
    return request<Appointment>(`/api/bookings/${bookingId}/complete`, {
      method: 'PATCH'
    });
  },

  async cancelBooking(bookingId: number, reason = 'Salon cancelled from dashboard') {
    return request<Appointment>(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  }
};
