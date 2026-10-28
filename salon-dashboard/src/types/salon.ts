export type NavigationTab =
  | 'Dashboard'
  | 'Appointments'
  | 'Customers'
  | 'Services'
  | 'Staff'
  | 'Analytics'
  | 'Settings'
  | 'Subscription';

export type BackendBookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export interface UserAccount {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  roles?: string[];
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserAccount;
}

export interface BusinessHour {
  dayOfWeek: number;
  openTime?: string;
  closeTime?: string;
  closed: boolean;
}

export interface Salon {
  id: number;
  ownerId?: number;
  name: string;
  phone?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  status?: string;
  businessHours?: BusinessHour[];
  createdAt?: string;
}

export interface Stylist {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl?: string;
  salonId: number;
  bio?: string;
  experienceYears?: number;
  status?: string;
  createdAt?: string;
}

export interface Appointment {
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
  status: BackendBookingStatus;
  totalAmount?: number | string;
  note?: string;
  createdAt?: string;
}

export interface ServiceItem {
  id: number;
  salonId: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number | string;
  status?: string;
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DashboardSnapshot {
  todayAppointments: number;
  pendingAppointments: number;
  monthRevenue: number;
  completedAppointments: number;
  activeServices: number;
  activeStylists: number;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';

export interface PaymentInfo {
  id: number;
  customerId?: number | null;
  bookingId?: number | null;
  salonId?: number | null;
  paymentType: 'BOOKING_CONNECTION' | 'SALON_PRO_SUBSCRIPTION';
  serviceAmount?: number | string | null;
  feeAmount?: number | string | null;
  provider?: string;
  transactionId?: string | null;
  referenceCode: string;
  amount: number | string;
  status: PaymentStatus;
  paymentUrl?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  refundAmount?: number | string | null;
  refundReason?: string | null;
  refundReference?: string | null;
  refundRequestedAt?: string | null;
  refundedAt?: string | null;
}
