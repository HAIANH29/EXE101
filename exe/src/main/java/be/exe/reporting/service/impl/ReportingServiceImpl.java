package be.exe.reporting.service.impl;

import be.exe.auth.service.AuthService;
import be.exe.booking.service.BookingService;
import be.exe.reporting.dto.response.BookingStatisticsResponse;
import be.exe.reporting.dto.response.DashboardOverviewResponse;
import be.exe.reporting.dto.response.RevenueReportResponse;
import be.exe.reporting.dto.response.SalonDashboardResponse;
import be.exe.reporting.dto.response.SalonDashboardResponse.MonthlyRevenue;
import be.exe.reporting.service.ReportingService;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.service.SalonService;
import be.exe.tryon.service.TryOnService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * Module reporting KHÔNG có domain/repository riêng - toàn bộ số liệu lấy qua Service interface
 * của các module sở hữu dữ liệu (AuthService, SalonService, BookingService, TryOnService).
 *
 * @Transactional(readOnly = true) ở class-level: toàn bộ module này chỉ đọc, không bao giờ ghi.
 */
@Service
@Transactional(readOnly = true)
public class ReportingServiceImpl implements ReportingService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    /** Số tháng hiển thị trong biểu đồ doanh thu của salon. */
    private static final int REVENUE_MONTHS = 6;

    private final AuthService authService;
    private final SalonService salonService;
    private final BookingService bookingService;
    private final TryOnService tryOnService;

    public ReportingServiceImpl(AuthService authService,
                                 SalonService salonService,
                                 BookingService bookingService,
                                 TryOnService tryOnService) {
        this.authService = authService;
        this.salonService = salonService;
        this.bookingService = bookingService;
        this.tryOnService = tryOnService;
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

                bookingService.getRevenueBetween(monthStart, now),

                tryOnService.countDistinctUsers(),
                tryOnService.countDistinctUsersBetween(monthStart, now),
                tryOnService.countRequests(),
                tryOnService.countRequestsBetween(monthStart, now)
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
        Instant nextMonthStart = YearMonth.now(VN_ZONE).plusMonths(1)
                .atDay(1).atStartOfDay(VN_ZONE).toInstant();
        Instant todayStart = LocalDate.now(VN_ZONE).atStartOfDay(VN_ZONE).toInstant();
        Instant tomorrowStart = LocalDate.now(VN_ZONE).plusDays(1)
                .atStartOfDay(VN_ZONE).toInstant();

        long pending = bookingService.countSalonBookingsByStatus(salonId, "PENDING");
        long confirmed = bookingService.countSalonBookingsByStatus(salonId, "CONFIRMED");
        long completed = bookingService.countSalonBookingsByStatus(salonId, "COMPLETED");
        long cancelled = bookingService.countSalonBookingsByStatus(salonId, "CANCELLED");

        List<MonthlyRevenue> revenueByMonth = buildRevenueByMonth(salonId);
        BigDecimal totalRevenue = revenueByMonth.stream()
                .map(MonthlyRevenue::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SalonDashboardResponse(
                salonId,
                bookingService.countSalonBookingsBetween(salonId, monthStart, now),
                bookingService.countSalonScheduledBookingsBetween(salonId, todayStart, tomorrowStart),
                bookingService.countUpcomingSalonBookings(salonId, now),
                pending,
                confirmed,
                completed,
                cancelled,
                bookingService.getSalonRevenueBetween(salonId, monthStart, nextMonthStart),
                salonService.countActiveStylists(salonId),
                pending + confirmed + completed + cancelled,
                totalRevenue,
                revenueByMonth
        );
    }

    /** Doanh thu (booking COMPLETED) của {@link #REVENUE_MONTHS} tháng gần nhất, cũ -> mới. */
    private List<MonthlyRevenue> buildRevenueByMonth(Long salonId) {
        YearMonth current = YearMonth.now(VN_ZONE);
        List<MonthlyRevenue> result = new ArrayList<>(REVENUE_MONTHS);
        for (int i = REVENUE_MONTHS - 1; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            Instant from = month.atDay(1).atStartOfDay(VN_ZONE).toInstant();
            Instant to = month.plusMonths(1).atDay(1).atStartOfDay(VN_ZONE).toInstant();
            BigDecimal revenue = bookingService.getSalonRevenueBetween(salonId, from, to);
            result.add(new MonthlyRevenue(month.toString(), revenue == null ? BigDecimal.ZERO : revenue));
        }
        return result;
    }

    /** Thời điểm đầu tháng hiện tại theo giờ Việt Nam. */
    private Instant currentMonthStart() {
        return YearMonth.now(VN_ZONE).atDay(1).atStartOfDay(VN_ZONE).toInstant();
    }
}
