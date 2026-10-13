import { Booking } from '../types';

class BookingStore {
  private bookings: Booking[] = [];

  public getAllBookings(): Booking[] {
    return [...this.bookings];
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
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

}

export const bookingService = new BookingStore();
