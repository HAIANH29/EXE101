package be.exe.reporting.controller;

import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.util.PaginationUtils;
import be.exe.booking.dto.response.BookingResponse;
import be.exe.booking.service.BookingService;
import be.exe.reporting.dto.response.SalonDashboardResponse;
import be.exe.reporting.service.ReportingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/salons/{salonId}/dashboard")
@PreAuthorize("hasRole('SALON_OWNER')")
public class SalonDashboardController {

    private final ReportingService reportingService;
    private final BookingService bookingService;

    public SalonDashboardController(ReportingService reportingService,
                                    BookingService bookingService) {
        this.reportingService = reportingService;
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SalonDashboardResponse>> getDashboard(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.success(
                reportingService.getSalonDashboard(salonId, principal.getUserId())));
    }

    @GetMapping("/upcoming-bookings")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getUpcomingBookings(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var bookings = bookingService.getUpcomingSalonBookings(
                salonId,
                principal.getUserId(),
                PaginationUtils.of(page, size, "startAt", "ASC"));
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(bookings)));
    }
}
