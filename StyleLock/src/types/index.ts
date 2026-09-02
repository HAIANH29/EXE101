export type GenderCategory = 'nam' | 'nu' | 'unisex';

export interface Hairstyle {
  id: string;
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
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Salon {
  id: string;
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
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: string;
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
