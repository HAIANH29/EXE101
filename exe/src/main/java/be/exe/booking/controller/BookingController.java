package be.exe.booking.controller;

import be.exe.booking.dto.request.CancelBookingRequest;
import be.exe.booking.dto.request.CreateBookingRequest;
import be.exe.booking.dto.request.RescheduleBookingRequest;
import be.exe.booking.dto.response.BookingDetailResponse;
import be.exe.booking.dto.response.BookingResponse;
import be.exe.booking.dto.response.AvailabilityResponse;
import be.exe.booking.service.BookingService;
import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateBookingRequest request) {
        BookingResponse response = bookingService.createBooking(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Đặt lịch thành công, đang chờ xác nhận", response));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> getBookingDetail(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long bookingId) {
        BookingDetailResponse response = bookingService.getBookingDetail(bookingId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size, "startAt", "DESC");
        var result = bookingService.getMyBookings(principal.getUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/salon/{salonId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getSalonBookings(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size, "startAt", "DESC");
        var result = bookingService.getSalonBookings(salonId, principal.getUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/stylist/{stylistId}")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getStylistBookings(
            @PathVariable Long stylistId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size, "startAt", "DESC");
        var result = bookingService.getStylistBookings(stylistId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/salon/{salonId}/stylists/{stylistId}/availability")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> getAvailability(
            @PathVariable Long salonId,
            @PathVariable Long stylistId,
            @RequestParam LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(
                bookingService.getAvailability(salonId, stylistId, date)));
    }

    @PatchMapping("/{bookingId}/confirm")
    @PreAuthorize("hasRole('SALON_OWNER') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> confirmBooking(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.confirmBooking(
                bookingId, principal.getUserId(), isAdmin(principal))));
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long bookingId,
            @RequestBody(required = false) CancelBookingRequest request) {
        BookingResponse response = bookingService.cancelBooking(bookingId, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy lịch hẹn", response));
    }

    @PatchMapping("/{bookingId}/reschedule")
    public ResponseEntity<ApiResponse<BookingResponse>> rescheduleBooking(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long bookingId,
            @Valid @RequestBody RescheduleBookingRequest request) {
        BookingResponse response = bookingService.rescheduleBooking(
                bookingId, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đã đổi lịch hẹn", response));
    }

    @PatchMapping("/{bookingId}/complete")
    @PreAuthorize("hasRole('SALON_OWNER') or hasRole('STAFF') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BookingResponse>> completeBooking(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long bookingId) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.completeBooking(
                bookingId, principal.getUserId(), isAdmin(principal))));
    }

    private boolean isAdmin(CustomUserDetails principal) {
        return principal.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
