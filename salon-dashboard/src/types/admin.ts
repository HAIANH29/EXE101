export type AdminTab = 'Overview' | 'Bookings' | 'Salons' | 'Users' | 'Catalog' | 'Payments' | 'Outcome3';

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
  tryOnUsers: number;
  tryOnUsersThisMonth: number;
  tryOnRequests: number;
  tryOnRequestsThisMonth: number;
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


export interface TrafficSourceRow {
  source: string;
  medium: string;
  campaign: string;
  visits: number;
  sessions: number;
}

export interface AdminTrafficReport {
  days: number;
  totalVisits: number;
  uniqueSessions: number;
  bySource: TrafficSourceRow[];
  byCampaign: TrafficSourceRow[];
}

export interface Outcome3Channel {
  source: string;
  medium: string;
  visits: number;
  sessions: number;
  signups: number;
  paidCustomers: number;
  transactions: number;
  revenue: number;
  signupToPaidPercent: number;
  visitToPaidPercent: number;
  averageOrderValue: number;
}

export interface Outcome3Report {
  summary: {
    grossRevenue: number;
    refundedAmount: number;
    netRevenue: number;
    totalUsers: number;
    transactions: number;
    paidCustomers: number;
    reviews: number;
    averageOrderValue: number;
    transactionThreshold: number;
    thresholdProgressPercent: number | null;
  };
  fairness: {
    topCustomerTransactions: number;
    topCustomerSharePercent: number;
    maxAllowedSharePercent: number;
    withinLimit: boolean;
  };
  reviews: {
    reviewedPaidCustomers: number;
    reviewRatePercent: number;
    averageRating: number;
    repeatCustomers: number;
    repeatPurchaseRatePercent: number;
  };
  channels: Outcome3Channel[];
}

export interface Outcome3Transaction {
  paymentId: number;
  orderId: number;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentMethod: string;
  referenceCode: string | null;
  gatewayTransactionId: string | null;
  amount: number;
  refundedAmount: number;
  status: string;
  paidAt: string | null;
}

export interface Outcome3UtmTrendPoint {
  date: string;
  facebookSessions: number;
  tiktokSessions: number;
  directSessions: number;
}

export interface Outcome3UtmChannelMetric {
  channelKey: 'facebook' | 'tiktok' | 'direct';
  source: string;
  medium: string;
  sourceMedium: string;
  sessions: number;
  signups: number;
  paidCustomers: number;
  transactions: number;
  revenue: number;
  signupToPaidPercent: number;
  visitToPaidPercent: number;
  averageOrderValue: number;
}

export interface Outcome3UtmSummary {
  sessions: number;
  signups: number;
  paidCustomers: number;
  transactions: number;
  revenue: number;
  signupToPaidPercent: number;
  visitToPaidPercent: number;
  averageOrderValue: number;
}

export interface Outcome3UtmAnalytics {
  from: string;
  to: string;
  trend: Outcome3UtmTrendPoint[];
  channels: Outcome3UtmChannelMetric[];
  total: Outcome3UtmSummary;
}
