import { PageResponse, PaidUserInfo, PaymentInfo, Salon, UserAccount } from '../types/salon';
import {
  AdminBookingStats,
  AdminOverview,
  AdminSalonStatus,
  AdminUserStatus,
  CreateSalonOwnerInput,
  Hairstyle,
  HairstyleCategory,
  HairstyleFormInput
} from '../types/admin';
import { request, salonApi, SalonFormInput } from './api';

export const adminApi = {
  getOverview() {
    return request<AdminOverview>('/api/dashboard/overview');
  },

  getBookingStats() {
    return request<AdminBookingStats>('/api/dashboard/bookings/statistics');
  },

  getSalons(status: AdminSalonStatus | '', page: number, size = 10) {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);
    return request<PageResponse<Salon>>(`/api/admin/salons?${query}`);
  },

  approveSalon(salonId: number) {
    return request<Salon>(`/api/admin/salons/${salonId}/approve`, {
      method: 'PATCH'
    });
  },

  rejectSalon(salonId: number) {
    return request<Salon>(`/api/admin/salons/${salonId}/reject`, {
      method: 'PATCH'
    });
  },

  updateSalon(salonId: number, input: SalonFormInput) {
    return request<Salon>(`/api/admin/salons/${salonId}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  },

  deleteSalon(salonId: number) {
    return request<void>(`/api/admin/salons/${salonId}`, {
      method: 'DELETE'
    });
  },

  uploadSalonImage(file: File) {
    return salonApi.uploadSalonImage(file);
  },

  updateSalonStatus(salonId: number, status: AdminSalonStatus) {
    return request<Salon>(`/api/salons/${salonId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getSalonDetail(salonId: number) {
    return request<Salon>(`/api/salons/${salonId}`);
  },

  getUsers(status: AdminUserStatus | '', page: number, size = 10) {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);
    return request<PageResponse<UserAccount>>(`/api/admin/users?${query}`);
  },

  createSalonOwner(input: CreateSalonOwnerInput) {
    return request<UserAccount>('/api/admin/users/salon-owner', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  updateUserStatus(userId: number, status: AdminUserStatus) {
    return request<UserAccount>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  deleteUser(userId: number) {
    return request<void>(`/api/admin/users/${userId}`, { method: 'DELETE' });
  },

  getPayments(page: number, size = 10, status?: string) {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);
    return request<PageResponse<PaymentInfo>>(`/api/admin/payments?${query}`);
  },

  getPaidUsers(page: number, size = 10) {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    return request<PageResponse<PaidUserInfo>>(`/api/admin/payments/paid-users?${query}`);
  },

  getPaymentById(paymentId: number) {
    return request<PaymentInfo>(`/api/admin/payments/${paymentId}`);
  },

  refundPayment(paymentId: number, input: { refundAmount: number; refundReference: string; note?: string }) {
    return request<PaymentInfo>(`/api/admin/payments/${paymentId}/refund`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  },

  async getHairstyles() {
    // BE giới hạn size tối đa 100/trang và chỉ trả kiểu tóc ACTIVE -> lấy hết các trang
    const all: Hairstyle[] = [];
    let page = 0;
    let totalPages = 1;
    while (page < totalPages) {
      const result = await request<PageResponse<Hairstyle>>(`/api/catalog/hairstyles?size=100&page=${page}`);
      all.push(...(result.content || []));
      totalPages = result.totalPages || 1;
      page += 1;
    }
    return all;
  },

  async uploadHairstyleImage(file: File) {
    const body = new FormData();
    body.append('file', file);
    const result = await request<{ url: string }>('/api/catalog/hairstyles/images', { method: 'POST', body });
    return result.url;
  },

  getCategories() {
    return request<HairstyleCategory[]>('/api/catalog/hairstyle-categories');
  },

  createCategory(input: { name: string; description?: string }) {
    return request<HairstyleCategory>('/api/catalog/hairstyle-categories', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  createHairstyle(input: HairstyleFormInput) {
    return request<Hairstyle>('/api/catalog/hairstyles', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },

  updateHairstyle(hairstyleId: number, input: HairstyleFormInput) {
    return request<Hairstyle>(`/api/catalog/hairstyles/${hairstyleId}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });
  }
};
