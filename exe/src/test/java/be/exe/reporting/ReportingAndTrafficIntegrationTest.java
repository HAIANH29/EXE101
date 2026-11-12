package be.exe.reporting;

import be.exe.analytics.dto.request.TrackVisitRequest;
import be.exe.analytics.dto.response.TrafficReportResponse;
import be.exe.analytics.service.TrafficAnalyticsService;
import be.exe.booking.domain.Booking;
import be.exe.booking.repository.BookingRepository;
import be.exe.reporting.dto.response.DashboardOverviewResponse;
import be.exe.reporting.service.ReportingService;
import be.exe.tryon.domain.TryOnRequest;
import be.exe.tryon.repository.TryOnRequestRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReportingAndTrafficIntegrationTest {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private ReportingService reportingService;
    @Autowired
    private TrafficAnalyticsService trafficService;
    @Autowired
    private TryOnRequestRepository tryOnRepository;
    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void overviewCountsDistinctTryOnUsers() {
        DashboardOverviewResponse before = reportingService.getDashboardOverview();

        saveTryOn(9001L);
        saveTryOn(9001L);
        saveTryOn(9002L);

        DashboardOverviewResponse after = reportingService.getDashboardOverview();
        assertEquals(before.tryOnUsers() + 2, after.tryOnUsers());
        assertEquals(before.tryOnRequests() + 3, after.tryOnRequests());
        assertEquals(before.tryOnUsersThisMonth() + 2, after.tryOnUsersThisMonth());
        assertEquals(before.tryOnRequestsThisMonth() + 3, after.tryOnRequestsThisMonth());
    }

    @Test
    void trafficReportGroupsBySourceAndDefaultsToDirect() {
        trafficService.trackVisit(new TrackVisitRequest("s1", "Facebook", "CPC", "Summer_Sale", null, null, "/", null));
        trafficService.trackVisit(new TrackVisitRequest("s1", "facebook", "cpc", "summer_sale", null, null, "/home", null));
        trafficService.trackVisit(new TrackVisitRequest("s2", "facebook", "cpc", "summer_sale", null, null, "/", null));
        trafficService.trackVisit(new TrackVisitRequest("s3", null, null, null, null, null, "/", null));

        TrafficReportResponse report = trafficService.getReport(30);

        assertEquals(4, report.totalVisits());
        assertEquals(3, report.uniqueSessions());
        var facebook = report.bySource().stream()
                .filter(r -> r.source().equals("facebook") && r.medium().equals("cpc"))
                .findFirst().orElseThrow();
        assertEquals(3, facebook.visits());
        assertEquals(2, facebook.sessions());
        assertTrue(report.bySource().stream().anyMatch(r -> r.source().equals("direct")));
        assertEquals("summer_sale", report.byCampaign().get(0).campaign());
        assertEquals(3, report.byCampaign().get(0).visits());
    }

    @Test
    void salonRevenueCountsOnlyCompletedBookingsInsideTheMonthByServiceDate() {
        YearMonth month = YearMonth.now(VN);
        Instant from = month.atDay(1).atStartOfDay(VN).toInstant();
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay(VN).toInstant();
        Instant inMonth = from.plusSeconds(3600 * 24 * 2);
        Instant lastMonth = from.minusSeconds(3600 * 24);

        saveBooking(777L, inMonth, "300000", true);   // COMPLETED trong tháng -> tính
        saveBooking(777L, inMonth, "100000", false);  // chưa hoàn tất -> không tính
        saveBooking(777L, lastMonth, "500000", true); // hoàn tất nhưng tháng trước -> không tính
        saveBooking(778L, inMonth, "900000", true);   // salon khác -> không tính

        BigDecimal revenue = bookingRepository.sumRevenueBySalonIdBetween(777L, from, to);
        assertEquals(0, new BigDecimal("300000").compareTo(revenue));
    }

    private void saveTryOn(Long userId) {
        TryOnRequest request = new TryOnRequest();
        request.setUserId(userId);
        request.setHairstyleId(1L);
        request.setInputImageUrl("http://example.com/a.jpg");
        request.setStatus("DONE");
        request.setCreatedAt(OffsetDateTime.now());
        tryOnRepository.save(request);
    }

    private void saveBooking(Long salonId, Instant startAt, String amount, boolean completed) {
        Booking booking = new Booking(1L, salonId, 1L, 1L, null, startAt,
                startAt.plusSeconds(3600), new BigDecimal(amount), null);
        if (completed) {
            booking.confirm();
            booking.complete();
        }
        bookingRepository.save(booking);
    }
}
