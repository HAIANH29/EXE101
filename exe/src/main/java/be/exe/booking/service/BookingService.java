package be.exe.booking.service;

import be.exe.booking.dto.request.CancelBookingRequest;
import be.exe.booking.dto.request.CreateBookingRequest;
import be.exe.booking.dto.response.BookingDetailResponse;
import be.exe.booking.dto.response.BookingResponse;
import be.exe.booking.dto.response.BookingSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookingService {

    BookingResponse createBooking(Long customerId, CreateBookingRequest request);

    BookingResponse confirmBooking(Long bookingId);

    BookingResponse cancelBooking(Long bookingId, Long requesterId, CancelBookingRequest request);

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

    Page<BookingResponse> getStylistBookings(Long stylistId, Pageable pageable);
}
