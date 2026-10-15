package be.exe.reporting.service;

import be.exe.reporting.dto.response.BookingStatisticsResponse;
import be.exe.reporting.dto.response.DashboardOverviewResponse;
import be.exe.reporting.dto.response.RevenueReportResponse;
import be.exe.reporting.dto.response.SalonDashboardResponse;

import java.time.Instant;

/**
 * Module reporting chỉ ĐỌC dữ liệu để thống kê - không có method nào ghi/sửa.
 * Đây là lý do tách riêng khỏi admin (module admin có ghi: khóa user, duyệt salon).
 */
public interface ReportingService {

    DashboardOverviewResponse getDashboardOverview();

    RevenueReportResponse getRevenueReport(Instant from, Instant to);

    BookingStatisticsResponse getBookingStatistics();

    SalonDashboardResponse getSalonDashboard(Long salonId, Long ownerId);
}
