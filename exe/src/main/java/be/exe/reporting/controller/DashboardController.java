package be.exe.reporting.controller;

import be.exe.common.response.ApiResponse;
import be.exe.reporting.dto.response.BookingStatisticsResponse;
import be.exe.reporting.dto.response.DashboardOverviewResponse;
import be.exe.reporting.dto.response.RevenueReportResponse;
import be.exe.reporting.service.ReportingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final ReportingService reportingService;

    public DashboardController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    /**
     * Số liệu tổng quan cho màn hình chính dashboard:
     * tổng user, salon chờ duyệt, booking tháng này, doanh thu tháng này...
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(reportingService.getDashboardOverview()));
    }

    /**
     * Báo cáo doanh thu theo khoảng thời gian tùy chọn.
     * Ví dụ: /api/dashboard/revenue?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z
     */
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ResponseEntity.ok(ApiResponse.success(reportingService.getRevenueReport(from, to)));
    }

    /** Thống kê số lượng booking theo từng trạng thái - dùng vẽ biểu đồ tròn/cột. */
    @GetMapping("/bookings/statistics")
    public ResponseEntity<ApiResponse<BookingStatisticsResponse>> getBookingStatistics() {
        return ResponseEntity.ok(ApiResponse.success(reportingService.getBookingStatistics()));
    }
}
