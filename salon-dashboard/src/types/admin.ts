export type AdminTab = 'Overview' | 'Users' | 'Catalog' | 'Payments';

export interface AdminOverview {
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
}

export interface AdminBookingStats {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
export type AdminSalonStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE';
export type HairstyleGender = 'MALE' | 'FEMALE' | 'UNISEX';

export interface HairstyleCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Hairstyle {
  id: number;
  categoryId?: number;
  name: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  gender?: HairstyleGender;
  status?: string;
}

export interface HairstyleFormInput {
  name: string;
  description?: string;
  imageUrl: string;
  imageUrls?: string[];
  categoryId?: number;
  gender?: HairstyleGender;
  status?: string;
}

export interface CreateSalonOwnerInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

