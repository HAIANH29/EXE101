package be.exe.reporting.service.impl;

import be.exe.auth.service.AuthService;
import be.exe.booking.service.BookingService;
import be.exe.reporting.dto.response.BookingStatisticsResponse;
import be.exe.reporting.dto.response.DashboardOverviewResponse;
import be.exe.reporting.dto.response.RevenueReportResponse;
import be.exe.reporting.dto.response.SalonDashboardResponse;
import be.exe.salon.service.SalonService;
import java.time.LocalDate;
import java.time.ZoneId;
import be.exe.reporting.service.ReportingService;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.service.SalonService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;

/**
 * Module reporting KHÔNG có domain/repository riêng - toàn bộ số liệu lấy qua Service interface
 * của các module sở hữu dữ liệu (AuthService, SalonService, BookingService).
 *
 * @Transactional(readOnly = true) ở class-level: toàn bộ module này chỉ đọc, không bao giờ ghi.
 */
@Service
@Transactional(readOnly = true)
public class ReportingServiceImpl implements ReportingService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AuthService authService;
    private final SalonService salonService;
    private final BookingService bookingService;

    public ReportingServiceImpl(AuthService authService,
                                 SalonService salonService,
                                 BookingService bookingService) {
        this.authService = authService;
        this.salonService = salonService;
        this.bookingService = bookingService;
    }

    @Override
    public DashboardOverviewResponse getDashboardOverview() {
        Instant monthStart = currentMonthStart();
        Instant now = Instant.now();

        return new DashboardOverviewResponse(
                authService.countUsers(),
                authService.countNewUsers(monthStart, now),

                salonService.countAllSalons(),
                salonService.countSalonsByStatus(SalonStatus.ACTIVE),
                salonService.countSalonsByStatus(SalonStatus.PENDING_APPROVAL),

                bookingService.countBookingsBetween(monthStart, now),
                bookingService.countBookingsByStatus("PENDING"),
                bookingService.countBookingsByStatus("COMPLETED"),
                bookingService.countBookingsByStatus("CANCELLED"),

                bookingService.getRevenueBetween(monthStart, now)
        );
    }

    @Override
    public RevenueReportResponse getRevenueReport(Instant from, Instant to) {
        BigDecimal revenue = bookingService.getRevenueBetween(from, to);
        long totalBookings = bookingService.countBookingsBetween(from, to);
        return new RevenueReportResponse(from, to, revenue, totalBookings);
    }

    @Override
    public BookingStatisticsResponse getBookingStatistics() {
        long pending = bookingService.countBookingsByStatus("PENDING");
        long confirmed = bookingService.countBookingsByStatus("CONFIRMED");
        long completed = bookingService.countBookingsByStatus("COMPLETED");
        long cancelled = bookingService.countBookingsByStatus("CANCELLED");

        return new BookingStatisticsResponse(
                pending, confirmed, completed, cancelled,
                pending + confirmed + completed + cancelled);
    }

    @Override
    public SalonDashboardResponse getSalonDashboard(Long salonId, Long ownerId) {
        salonService.verifyOwner(salonId, ownerId);

        Instant now = Instant.now();
        Instant monthStart = currentMonthStart();
        Instant todayStart = LocalDate.now(VN_ZONE).atStartOfDay(VN_ZONE).toInstant();
        Instant tomorrowStart = LocalDate.now(VN_ZONE).plusDays(1)
                .atStartOfDay(VN_ZONE).toInstant();

        return new SalonDashboardResponse(
                salonId,
                bookingService.countSalonBookingsBetween(salonId, monthStart, now),
                bookingService.countSalonScheduledBookingsBetween(salonId, todayStart, tomorrowStart),
                bookingService.countUpcomingSalonBookings(salonId, now),
                bookingService.countSalonBookingsByStatus(salonId, "PENDING"),
                bookingService.countSalonBookingsByStatus(salonId, "CONFIRMED"),
                bookingService.countSalonBookingsByStatus(salonId, "COMPLETED"),
                bookingService.countSalonBookingsByStatus(salonId, "CANCELLED"),
                bookingService.getSalonRevenueBetween(salonId, monthStart, now),
                salonService.countActiveStylists(salonId)
        );
    }

    /** Thời điểm đầu tháng hiện tại theo giờ Việt Nam. */
    private Instant currentMonthStart() {
        return YearMonth.now(VN_ZONE).atDay(1).atStartOfDay(VN_ZONE).toInstant();
    }
}
