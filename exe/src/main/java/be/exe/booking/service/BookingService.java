package be.exe.booking.service;

import be.exe.booking.dto.request.CancelBookingRequest;
import be.exe.booking.dto.request.CreateBookingRequest;
import be.exe.booking.dto.request.RescheduleBookingRequest;
import be.exe.booking.dto.response.BookingDetailResponse;
import be.exe.booking.dto.response.BookingResponse;
import be.exe.booking.dto.response.BookingSummaryResponse;
import be.exe.booking.dto.response.AvailabilityResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public interface BookingService {

    BookingResponse createBooking(Long customerId, CreateBookingRequest request);

    BookingResponse confirmBooking(Long bookingId);

    BookingResponse cancelBooking(Long bookingId, Long requesterId, CancelBookingRequest request);

    BookingResponse rescheduleBooking(Long bookingId, Long requesterId, RescheduleBookingRequest request);

    BookingResponse completeBooking(Long bookingId);

    BookingDetailResponse getBookingDetail(Long bookingId, Long requesterId);

    /**
     * Dùng bởi module khác (review, payment) - chỉ trả dữ liệu tối thiểu.
     * Ném ResourceNotFoundException nếu không tồn tại.
     */
    BookingSummaryResponse getBookingOrThrow(Long bookingId);

    Page<BookingResponse> getMyBookings(Long customerId, Pageable pageable);

    /**
     * ownerId = id của người đang gọi API (lấy từ JWT) - dùng để verify đúng là chủ salon này
     * mới được xem danh sách booking, tránh 1 salon owner xem được booking của salon khác.
     */
    Page<BookingResponse> getSalonBookings(Long salonId, Long ownerId, Pageable pageable);

    Page<BookingResponse> getUpcomingSalonBookings(Long salonId, Long ownerId, Pageable pageable);

    Page<BookingResponse> getStylistBookings(Long stylistId, Pageable pageable);

    AvailabilityResponse getAvailability(Long salonId, Long stylistId, LocalDate date);

    // ===== Dùng cho dashboard (module admin) =====

    long countBookingsByStatus(String status);

    long countBookingsBetween(Instant from, Instant to);

    BigDecimal getRevenueBetween(Instant from, Instant to);

    long countSalonBookingsByStatus(Long salonId, String status);

    long countSalonBookingsBetween(Long salonId, Instant from, Instant to);

    long countSalonScheduledBookingsBetween(Long salonId, Instant from, Instant to);

    long countUpcomingSalonBookings(Long salonId, Instant from);

    BigDecimal getSalonRevenueBetween(Long salonId, Instant from, Instant to);
}
