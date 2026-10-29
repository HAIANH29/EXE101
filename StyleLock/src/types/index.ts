export type GenderCategory = 'nam' | 'nu' | 'unisex';

export interface Hairstyle {
  id: string;
  apiId?: number;
  name: string;
  category: string;
  gender: GenderCategory;
  imageUrl: string;
  /** Gallery từ backend (tối đa 5 ảnh, ảnh đầu là ảnh bìa = imageUrl). */
  imageUrls?: string[];
  description: string;
  suitableFace: string;
  tag?: string;
}

export interface ServiceItem {
  id: string;
  apiId?: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Salon {
  id: string;
  apiId?: number;
  name: string;
  address: string;
  distance: string;
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  priceRange: string;
  minPrice?: number;
  maxPrice?: number;
  phone: string;
  imageUrl: string;
  description?: string;
  openingHours: string;
  supportedHairstyles: string[]; // Hairstyle IDs
  services: ServiceItem[];
  stylists?: StylistItem[];
  isExternal?: boolean;
  mapUrl?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  bookingEligible?: boolean;
  demo?: boolean;
  externalPlaceId?: string;
}

export interface StylistItem {
  id: string;
  apiId?: number;
  name: string;
  role?: string;
  avatar?: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: string;
  apiId?: number;
  customerName: string;
  customerPhone: string;
  salonId: string;
  salonName: string;
  salonAddress: string;
  hairstyleId?: string;
  hairstyleName?: string;
  tryOnImageUrl?: string;
  serviceId?: string;
  serviceName?: string;
  stylistId?: string;
  stylistName?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm
  status: BookingStatus;
  createdAt: string;
  totalPrice?: number;
  qrCode?: string;
}

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_REFUND_REQUESTED'
  | 'PAYMENT_REFUNDED';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
export type PaymentType = 'BOOKING_CONNECTION' | 'SALON_PRO_SUBSCRIPTION';

export interface Payment {
  id: number;
  bookingId?: number;
  salonId?: number;
  type: PaymentType;
  serviceAmount: number;
  feeAmount: number;
  amount: number;
  status: PaymentStatus;
  provider?: string;
  referenceCode: string;
  qrUrl?: string;
  bankCode?: string;
  bankAccount?: string;
  transferContent?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  refundAmount?: number;
  refundReason?: string;
  refundReference?: string;
  refundRequestedAt?: string;
  refundedAt?: string;
}
