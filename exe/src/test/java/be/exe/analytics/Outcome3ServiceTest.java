package be.exe.analytics;

import be.exe.analytics.domain.TrafficVisit;
import be.exe.analytics.dto.response.Outcome3ReportResponse;
import be.exe.analytics.repository.TrafficVisitRepository;
import be.exe.analytics.service.Outcome3Service;
import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.repository.RoleRepository;
import be.exe.auth.repository.UserRepository;
import be.exe.payment.domain.Payment;
import be.exe.payment.domain.PaymentType;
import be.exe.payment.repository.PaymentRepository;
import be.exe.review.domain.Review;
import be.exe.review.repository.ReviewRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class Outcome3ServiceTest {

    @Autowired Outcome3Service service;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired TrafficVisitRepository visitRepository;
    @Autowired PaymentRepository paymentRepository;
    @Autowired ReviewRepository reviewRepository;

    @Test
    void attributesPaidCustomerToFirstVisitChannelAndComputesMetrics() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        String source = "tiktok-" + tag;
        String session = "sess-" + tag;
        long baseTx = service.getReport().summary().transactions();

        visitRepository.save(new TrafficVisit(session, source, "cpc", "camp", null, null, "/", null));
        // lượt thứ 2 của cùng phiên với nguồn khác không được làm đổi kênh
        visitRepository.save(new TrafficVisit(session, "other-" + tag, "x", null, null, null, "/", null));

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER).orElseGet(
                () -> roleRepository.save(new Role(RoleName.CUSTOMER)));
        User user = new User("o3-" + tag + "@test.local", "x", "O3 User");
        user.addRole(customerRole);
        user.setSignupSessionId(session);
        user = userRepository.save(user);

        for (int i = 0; i < 2; i++) {
            Payment p = new Payment(1000L + i + Math.abs(tag.hashCode() % 100000), user.getId(), 1L,
                    PaymentType.BOOKING_CONNECTION, new BigDecimal("95000"), new BigDecimal("5000"),
                    new BigDecimal("100000"), "DH" + tag + i, null);
            p.markPaid("sepay-" + tag + i);
            paymentRepository.save(p);
        }
        reviewRepository.save(new Review(777000L + Math.abs(tag.hashCode() % 1000), user.getId(), 1L, (short) 5, "ok"));

        Outcome3ReportResponse report = service.getReport();

        assertThat(report.summary().transactions()).isEqualTo(baseTx + 2);
        var row = report.channels().stream()
                .filter(c -> c.source().equals(source)).findFirst().orElseThrow();
        assertThat(row.medium()).isEqualTo("cpc");
        assertThat(row.signups()).isEqualTo(1);
        assertThat(row.paidCustomers()).isEqualTo(1);
        assertThat(row.transactions()).isEqualTo(2);
        assertThat(row.revenue()).isEqualByComparingTo("200000");
        assertThat(row.averageOrderValue()).isEqualByComparingTo("100000");
        assertThat(row.signupToPaidPercent()).isEqualTo(100.0);
        assertThat(report.channels().stream().noneMatch(c -> c.source().equals("other-" + tag)
                && c.signups() > 0)).isTrue();
        assertThat(report.reviews().reviewedPaidCustomers()).isGreaterThanOrEqualTo(1);
        assertThat(report.reviews().repeatCustomers()).isGreaterThanOrEqualTo(1);
        assertThat(service.getTransactions(0, 5)).isNotEmpty();
    }

    @Test
    void computesDateRangeUtmAnalyticsForThreePrimaryChannelsWithFirstTouch() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        String fbSession = "fb-sess-" + tag;
        String ttSession = "tt-sess-" + tag;
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        var baseline = service.getUtmAnalytics(today.minusDays(6), today);
        long baseFbSessions = baseline.channels().stream()
                .filter(c -> c.channelKey().equals("facebook")).findFirst().orElseThrow().sessions();
        long baseTtSessions = baseline.channels().stream()
                .filter(c -> c.channelKey().equals("tiktok")).findFirst().orElseThrow().sessions();

        // First-touch = facebook, second visit in same session = tiktok -> must stay attributed to facebook
        visitRepository.save(new TrafficVisit(fbSession, "facebook", "social", "camp1", null, null, "/", null));
        visitRepository.save(new TrafficVisit(fbSession, "tiktok", "social", "camp2", null, null, "/", null));
        visitRepository.save(new TrafficVisit(ttSession, "tiktok", "social", "camp3", null, null, "/", null));

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER).orElseGet(
                () -> roleRepository.save(new Role(RoleName.CUSTOMER)));
        User fbUser = new User("fb-" + tag + "@test.local", "x", "FB User");
        fbUser.addRole(customerRole);
        fbUser.setSignupSessionId(fbSession);
        fbUser = userRepository.save(fbUser);

        Payment p = new Payment(2000L + Math.abs(tag.hashCode() % 100000), fbUser.getId(), 1L,
                PaymentType.BOOKING_CONNECTION, new BigDecimal("120000"), new BigDecimal("5000"),
                new BigDecimal("125000"), "DHFB" + tag, null);
        p.markPaid("sepay-fb-" + tag);
        paymentRepository.save(p);

        var utm = service.getUtmAnalytics(today.minusDays(6), today);

        assertThat(utm.trend()).hasSize(7);
        assertThat(utm.channels()).extracting(c -> c.sourceMedium())
                .containsExactly("facebook / social", "tiktok / social", "(direct) / (none)");

        var fbRow = utm.channels().get(0);
        var ttRow = utm.channels().get(1);
        assertThat(fbRow.sessions()).isEqualTo(baseFbSessions + 1);
        assertThat(ttRow.sessions()).isEqualTo(baseTtSessions + 1);
        assertThat(fbRow.signups()).isGreaterThanOrEqualTo(1);
        assertThat(fbRow.paidCustomers()).isGreaterThanOrEqualTo(1);
        assertThat(fbRow.transactions()).isGreaterThanOrEqualTo(1);
        assertThat(fbRow.revenue()).isGreaterThanOrEqualTo(new BigDecimal("125000"));
        assertThat(utm.total().sessions()).isEqualTo(
                utm.channels().stream().mapToLong(c -> c.sessions()).sum());
    }
}
