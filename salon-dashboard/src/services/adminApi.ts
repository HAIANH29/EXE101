import { PageResponse, PaymentInfo, Salon, UserAccount } from '../types/salon';
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
import { request } from './api';

export const adminApi = {
  getOverview() {
    return request<AdminOverview>('/api/dashboard/overview');
  },

  getBookingStats() {
    return request<AdminBookingStats>('/api/dashboard/bookings/statistics');
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

  getSalons(status: AdminSalonStatus | '', page: number, size = 10) {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set('status', status);
    return request<PageResponse<Salon>>(`/api/admin/salons?${query}`);
  },

  approveSalon(salonId: number) {
    return request<Salon>(`/api/admin/salons/${salonId}/approve`, { method: 'PATCH' });
  },

  rejectSalon(salonId: number) {
    return request<Salon>(`/api/admin/salons/${salonId}/reject`, { method: 'PATCH' });
  },

  refundPayment(paymentId: number, input: { refundAmount: number; refundReference: string; note?: string }) {
    return request<PaymentInfo>(`/api/admin/payments/${paymentId}/refund`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  },

  async getHairstyles() {
    const result = await request<PageResponse<Hairstyle>>('/api/catalog/hairstyles?size=100');
    return result.content || [];
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
