import { Booking, BookingStatus } from '../types';
import { INITIAL_BOOKINGS } from './mockData';

class BookingStore {
  private bookings: Booking[] = [];

  public getAllBookings(): Booking[] {
    return [...this.bookings];
  }

  public getDemoBookings(): Booking[] {
    return [...INITIAL_BOOKINGS];
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  public getBookingsByPhone(phone: string): Booking[] {
    return this.bookings.filter((b) => b.customerPhone === phone);
  }

  public getBookingsBySalon(salonId: string): Booking[] {
    return this.bookings.filter((b) => b.salonId === salonId);
  }

  public upsertBooking(booking: Booking): Booking {
    const bookingIndex = this.bookings.findIndex((b) => b.id === booking.id);
    if (bookingIndex === -1) {
      this.bookings.unshift(booking);
      return booking;
    }

    const current = this.bookings[bookingIndex];
    this.bookings[bookingIndex] = {
      ...current,
      ...booking,
      salonAddress: booking.salonAddress || current.salonAddress,
      serviceName: booking.serviceName || current.serviceName,
      hairstyleName: booking.hairstyleName || current.hairstyleName,
      tryOnImageUrl: booking.tryOnImageUrl || current.tryOnImageUrl,
      qrCode: booking.qrCode || current.qrCode
    };
    return this.bookings[bookingIndex];
  }

  public replaceBookings(bookings: Booking[]): Booking[] {
    this.bookings = bookings;
    return this.getAllBookings();
  }

  public clear(): void {
    this.bookings = [];
  }

  public createBooking(newBookingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'qrCode'>): Booking {
    const id = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newBooking: Booking = {
      ...newBookingData,
      id,
      status: 'PENDING',
      createdAt,
      qrCode: `STYLELOCK-${id}`
    };

    this.bookings.unshift(newBooking);
    return newBooking;
  }

  public updateBookingStatus(id: string, status: BookingStatus): Booking | undefined {
    const bookingIndex = this.bookings.findIndex((b) => b.id === id);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex] = {
        ...this.bookings[bookingIndex],
        status
      };
      return this.bookings[bookingIndex];
    }
    return undefined;
  }

  public getAnalytics() {
    const totalBookings = this.bookings.length;
    const pendingBookings = this.bookings.filter((b) => b.status === 'PENDING').length;
    const confirmedBookings = this.bookings.filter((b) => b.status === 'CONFIRMED').length;
    const completedBookings = this.bookings.filter((b) => b.status === 'COMPLETED').length;
    const cancelledBookings = this.bookings.filter((b) => b.status === 'CANCELLED').length;
    const totalRevenue = this.bookings
      .filter((b) => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    };
  }
}

export const bookingService = new BookingStore();
