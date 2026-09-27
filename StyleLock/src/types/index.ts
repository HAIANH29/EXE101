export type GenderCategory = 'nam' | 'nu' | 'unisex';

export interface Hairstyle {
  id: string;
  apiId?: number;
  name: string;
  category: string;
  gender: GenderCategory;
  imageUrl: string;
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
  rating: number;
  reviewCount: number;
  priceRange: string;
  phone: string;
  imageUrl: string;
  openingHours: string;
  supportedHairstyles: string[]; // Hairstyle IDs
  services: ServiceItem[];
  stylists?: StylistItem[];
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
  | 'PAYMENT_COMPLETED';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}
