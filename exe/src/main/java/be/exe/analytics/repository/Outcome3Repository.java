package be.exe.analytics.repository;

import be.exe.analytics.dto.response.Outcome3ReportResponse.ChannelRow;
import be.exe.analytics.dto.response.Outcome3ReportResponse.TransactionRow;
import be.exe.analytics.dto.response.Outcome3UtmAnalyticsResponse;
import be.exe.analytics.dto.response.Outcome3UtmAnalyticsResponse.ChannelMetric;
import be.exe.analytics.dto.response.Outcome3UtmAnalyticsResponse.ChannelSummary;
import be.exe.analytics.dto.response.Outcome3UtmAnalyticsResponse.DailyTrendPoint;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Truy vấn chỉ-đọc cho báo cáo Outcome 3. Cố ý dùng SQL thuần xuyên bảng
 * (payments, users, reviews, traffic_visits) vì đây là báo cáo tổng hợp, không ghi dữ liệu.
 */
@Repository
public class Outcome3Repository {

    /** Payment đã thực sự nhận tiền (kể cả sau đó bị hoàn). */
    private static final String PAID = "p.payment_type = 'BOOKING_CONNECTION' "
            + "AND p.status IN ('PAID', 'REFUND_PENDING', 'REFUNDED')";
    private static final String REFUNDED_AMOUNT =
            "CASE WHEN p.status = 'REFUNDED' THEN COALESCE(p.refund_amount, p.amount) ELSE 0 END";
    private static final String SEP = "|";
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String CHANNEL_CASE_FV = """
            CASE
                WHEN LOWER(TRIM(COALESCE(fv.utm_source, ''))) IN ('facebook', 'fb', 'meta') THEN 'facebook'
                WHEN LOWER(TRIM(COALESCE(fv.utm_source, ''))) IN ('tiktok', 'tt') THEN 'tiktok'
                ELSE 'direct'
            END
            """;

    private final JdbcTemplate jdbc;

    public Outcome3Repository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Totals(BigDecimal gross, BigDecimal refunded, long transactions, long paidCustomers) {
    }

    public record CustomerCounts(long topCustomerTransactions, long repeatCustomers) {
    }

    private record UserStats(long signups, long paidCustomers, long transactions, BigDecimal revenue) {
    }

    public Totals totals() {
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(p.amount), 0), COALESCE(SUM(%s), 0),
                       COUNT(*), COUNT(DISTINCT p.customer_id)
                FROM payments p WHERE %s
                """.formatted(REFUNDED_AMOUNT, PAID),
                (rs, i) -> new Totals(rs.getBigDecimal(1), rs.getBigDecimal(2), rs.getLong(3), rs.getLong(4)));
    }

    public long countCustomers() {
        return jdbc.queryForObject("""
                SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id WHERE r.name = 'CUSTOMER'
                """, Long.class);
    }

    public long countReviews() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM reviews", Long.class);
    }

    public double averageRating() {
        Double avg = jdbc.queryForObject("SELECT AVG(rating) FROM reviews", Double.class);
        return avg == null ? 0.0 : avg;
    }

    /** Số khách đã trả tiền có ít nhất 1 review. */
    public long reviewedPaidCustomers() {
        return jdbc.queryForObject("""
                SELECT COUNT(DISTINCT rv.customer_id) FROM reviews rv
                WHERE rv.customer_id IN (SELECT p.customer_id FROM payments p WHERE %s)
                """.formatted(PAID), Long.class);
    }

    public CustomerCounts customerCounts() {
        return jdbc.queryForObject("""
                SELECT COALESCE(MAX(c), 0), COUNT(*) FILTER (WHERE c >= 2)
                FROM (SELECT COUNT(*) AS c FROM payments p WHERE %s GROUP BY p.customer_id) t
                """.formatted(PAID),
                (rs, i) -> new CustomerCounts(rs.getLong(1), rs.getLong(2)));
    }

    /**
     * Theo kênh: lượt truy cập từ traffic_visits; user/giao dịch/doanh thu quy về kênh của
     * lượt truy cập ĐẦU TIÊN trong phiên đăng ký (users.signup_session_id). Không có phiên = direct/none.
     */
    public List<ChannelRow> channels() {
        Map<String, long[]> visits = new LinkedHashMap<>();
        jdbc.query("""
                SELECT utm_source, utm_medium, COUNT(*), COUNT(DISTINCT session_id)
                FROM traffic_visits GROUP BY utm_source, utm_medium
                """, rs -> {
            visits.put(key(rs.getString(1), rs.getString(2)), new long[]{rs.getLong(3), rs.getLong(4)});
        });

        Map<String, UserStats> users = new LinkedHashMap<>();
        jdbc.query("""
                WITH first_visit AS (
                    SELECT session_id, utm_source, utm_medium FROM (
                        SELECT session_id, utm_source, utm_medium,
                               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at, id) AS rn
                        FROM traffic_visits
                    ) t WHERE rn = 1
                ),
                cust AS (
                    SELECT u.id, COALESCE(fv.utm_source, 'direct') AS src, COALESCE(fv.utm_medium, 'none') AS med
                    FROM users u
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id AND r.name = 'CUSTOMER'
                    LEFT JOIN first_visit fv ON fv.session_id = u.signup_session_id
                ),
                pay AS (
                    SELECT p.customer_id, COUNT(*) AS tx, SUM(p.amount - (%s)) AS revenue
                    FROM payments p WHERE %s GROUP BY p.customer_id
                )
                SELECT c.src, c.med, COUNT(*) AS signups,
                       COUNT(pay.customer_id) AS paid_customers,
                       COALESCE(SUM(pay.tx), 0) AS tx, COALESCE(SUM(pay.revenue), 0) AS revenue
                FROM cust c LEFT JOIN pay ON pay.customer_id = c.id
                GROUP BY c.src, c.med
                """.formatted(REFUNDED_AMOUNT, PAID), rs -> {
            users.put(key(rs.getString(1), rs.getString(2)),
                    new UserStats(rs.getLong(3), rs.getLong(4), rs.getLong(5), rs.getBigDecimal(6)));
        });

        List<String> keys = new ArrayList<>(visits.keySet());
        users.keySet().stream().filter(k -> !visits.containsKey(k)).forEach(keys::add);

        List<ChannelRow> rows = new ArrayList<>();
        for (String k : keys) {
            String[] sm = k.split("\\" + SEP, 2);
            long[] v = visits.getOrDefault(k, new long[]{0, 0});
            UserStats u = users.getOrDefault(k, new UserStats(0, 0, 0, BigDecimal.ZERO));
            rows.add(new ChannelRow(sm[0], sm.length > 1 ? sm[1] : "", v[0], v[1],
                    u.signups(), u.paidCustomers(), u.transactions(), u.revenue(),
                    percent(u.paidCustomers(), u.signups()), percent(u.paidCustomers(), v[1]),
                    u.transactions() == 0 ? BigDecimal.ZERO
                            : u.revenue().divide(BigDecimal.valueOf(u.transactions()), 0, RoundingMode.HALF_UP)));
        }
        rows.sort((a, b) -> {
            int c = b.revenue().compareTo(a.revenue());
            return c != 0 ? c : Long.compare(b.visits(), a.visits());
        });
        return rows;
    }

    public List<TransactionRow> transactions(int limit, int offset) {
        return jdbc.query("""
                SELECT p.id, p.booking_id, p.customer_id, u.full_name, u.email, u.phone, p.provider, p.reference_code,
                       p.transaction_id, p.amount, %s, p.status, p.paid_at
                FROM payments p LEFT JOIN users u ON u.id = p.customer_id
                WHERE %s
                ORDER BY p.paid_at DESC NULLS LAST, p.id DESC
                LIMIT ? OFFSET ?
                """.formatted(REFUNDED_AMOUNT, PAID), (rs, i) -> {
            Timestamp paidAt = rs.getTimestamp(13);
            return new TransactionRow(rs.getLong(1), rs.getLong(2), rs.getLong(3), rs.getString(4),
                    rs.getString(5), rs.getString(6), rs.getString(7), rs.getString(8), rs.getString(9),
                    rs.getBigDecimal(10), rs.getBigDecimal(11), rs.getString(12),
                    paidAt == null ? null : paidAt.toInstant());
        }, limit, offset);
    }

    private static String key(String source, String medium) {
        return source + SEP + medium;
    }

    /**
     * Báo cáo G3.3 theo khoảng ngày [from..to] (giờ Việt Nam Asia/Ho_Chi_Minh),
     * sử dụng First-Touch Attribution cho 3 nhóm kênh chính:
     * facebook / social, tiktok / social, (direct) / (none).
     */
    public Outcome3UtmAnalyticsResponse utmAnalytics(LocalDate from, LocalDate to) {
        Instant fromInstant = from.atStartOfDay(VN_ZONE).toInstant();
        Instant toExclusive = to.plusDays(1).atStartOfDay(VN_ZONE).toInstant();
        Timestamp fromTs = Timestamp.from(fromInstant);
        Timestamp toTs = Timestamp.from(toExclusive);

        // 1. Xu hướng phiên duy nhất theo ngày (First-Touch theo session_id)
        Map<LocalDate, long[]> dailyMap = new HashMap<>();
        jdbc.query("""
                WITH first_visit AS (
                    SELECT session_id, utm_source, created_at FROM (
                        SELECT session_id, utm_source, created_at,
                               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at, id) AS rn
                        FROM traffic_visits
                    ) t WHERE rn = 1
                )
                SELECT CAST(fv.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS DATE) AS visit_date,
                       %s AS channel_key,
                       COUNT(DISTINCT fv.session_id) AS sessions
                FROM first_visit fv
                WHERE fv.created_at >= ? AND fv.created_at < ?
                GROUP BY visit_date, channel_key
                """.formatted(CHANNEL_CASE_FV), rs -> {
            LocalDate day = rs.getDate(1).toLocalDate();
            String channel = rs.getString(2);
            long count = rs.getLong(3);
            long[] bucket = dailyMap.computeIfAbsent(day, k -> new long[3]);
            if ("facebook".equals(channel)) {
                bucket[0] += count;
            } else if ("tiktok".equals(channel)) {
                bucket[1] += count;
            } else {
                bucket[2] += count;
            }
        }, fromTs, toTs);

        List<DailyTrendPoint> trend = new ArrayList<>();
        Map<String, Long> totalSessionsByChannel = new HashMap<>();
        totalSessionsByChannel.put("facebook", 0L);
        totalSessionsByChannel.put("tiktok", 0L);
        totalSessionsByChannel.put("direct", 0L);

        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            long[] bucket = dailyMap.getOrDefault(d, new long[3]);
            trend.add(new DailyTrendPoint(d, bucket[0], bucket[1], bucket[2]));
            totalSessionsByChannel.merge("facebook", bucket[0], Long::sum);
            totalSessionsByChannel.merge("tiktok", bucket[1], Long::sum);
            totalSessionsByChannel.merge("direct", bucket[2], Long::sum);
        }

        // 2. Đăng ký trong khoảng ngày theo First-Touch channel
        Map<String, Long> signupsByChannel = new HashMap<>();
        jdbc.query("""
                WITH first_visit AS (
                    SELECT session_id, utm_source FROM (
                        SELECT session_id, utm_source,
                               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at, id) AS rn
                        FROM traffic_visits
                    ) t WHERE rn = 1
                )
                SELECT %s AS channel_key, COUNT(DISTINCT u.id) AS signups
                FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id AND r.name = 'CUSTOMER'
                LEFT JOIN first_visit fv ON fv.session_id = u.signup_session_id
                WHERE u.created_at >= ? AND u.created_at < ?
                GROUP BY channel_key
                """.formatted(CHANNEL_CASE_FV), rs -> {
            signupsByChannel.put(rs.getString(1), rs.getLong(2));
        }, fromTs, toTs);

        // 3. Khách trả tiền, giao dịch & doanh thu ròng trong khoảng ngày theo First-Touch channel
        record PayChannelStats(long paidCustomers, long transactions, BigDecimal revenue) {
        }
        Map<String, PayChannelStats> payByChannel = new HashMap<>();
        jdbc.query("""
                WITH first_visit AS (
                    SELECT session_id, utm_source FROM (
                        SELECT session_id, utm_source,
                               ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at, id) AS rn
                        FROM traffic_visits
                    ) t WHERE rn = 1
                )
                SELECT %s AS channel_key,
                       COUNT(DISTINCT p.customer_id) AS paid_customers,
                       COUNT(*) AS tx,
                       COALESCE(SUM(p.amount - (%s)), 0) AS revenue
                FROM payments p
                LEFT JOIN users u ON u.id = p.customer_id
                LEFT JOIN first_visit fv ON fv.session_id = u.signup_session_id
                WHERE %s
                  AND COALESCE(p.paid_at, p.created_at) >= ?
                  AND COALESCE(p.paid_at, p.created_at) < ?
                GROUP BY channel_key
                """.formatted(CHANNEL_CASE_FV, REFUNDED_AMOUNT, PAID), rs -> {
            payByChannel.put(rs.getString(1),
                    new PayChannelStats(rs.getLong(2), rs.getLong(3), rs.getBigDecimal(4)));
        }, fromTs, toTs);

        // Luôn trả đủ 3 nhóm kênh chính theo yêu cầu G3.3
        String[][] channelDefs = {
                {"facebook", "facebook", "social", "facebook / social"},
                {"tiktok", "tiktok", "social", "tiktok / social"},
                {"direct", "(direct)", "(none)", "(direct) / (none)"}
        };

        List<ChannelMetric> channels = new ArrayList<>(3);
        long sumSessions = 0;
        long sumSignups = 0;
        long sumPaidCustomers = 0;
        long sumTransactions = 0;
        BigDecimal sumRevenue = BigDecimal.ZERO;

        for (String[] def : channelDefs) {
            String chKey = def[0];
            long sessions = totalSessionsByChannel.getOrDefault(chKey, 0L);
            long signups = signupsByChannel.getOrDefault(chKey, 0L);
            PayChannelStats pay = payByChannel.getOrDefault(chKey, new PayChannelStats(0, 0, BigDecimal.ZERO));

            BigDecimal aov = pay.transactions() == 0
                    ? BigDecimal.ZERO
                    : pay.revenue().divide(BigDecimal.valueOf(pay.transactions()), 0, RoundingMode.HALF_UP);

            channels.add(new ChannelMetric(
                    chKey, def[1], def[2], def[3],
                    sessions, signups, pay.paidCustomers(), pay.transactions(), pay.revenue(),
                    percent(pay.paidCustomers(), signups),
                    percent(pay.paidCustomers(), sessions),
                    aov
            ));

            sumSessions += sessions;
            sumSignups += signups;
            sumPaidCustomers += pay.paidCustomers();
            sumTransactions += pay.transactions();
            sumRevenue = sumRevenue.add(pay.revenue());
        }

        BigDecimal totalAov = sumTransactions == 0
                ? BigDecimal.ZERO
                : sumRevenue.divide(BigDecimal.valueOf(sumTransactions), 0, RoundingMode.HALF_UP);

        ChannelSummary total = new ChannelSummary(
                sumSessions,
                sumSignups,
                sumPaidCustomers,
                sumTransactions,
                sumRevenue,
                percent(sumPaidCustomers, sumSignups),
                percent(sumPaidCustomers, sumSessions),
                totalAov
        );

        return new Outcome3UtmAnalyticsResponse(from, to, trend, channels, total);
    }

    public static double percent(long part, long whole) {
        return whole == 0 ? 0.0 : Math.round(part * 1000.0 / whole) / 10.0;
    }
}
