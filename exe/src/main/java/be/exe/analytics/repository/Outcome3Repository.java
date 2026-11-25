package be.exe.analytics.repository;

import be.exe.analytics.dto.response.Outcome3ReportResponse.ChannelRow;
import be.exe.analytics.dto.response.Outcome3ReportResponse.TransactionRow;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.util.ArrayList;
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

    public static double percent(long part, long whole) {
        return whole == 0 ? 0.0 : Math.round(part * 1000.0 / whole) / 10.0;
    }
}
