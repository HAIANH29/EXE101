package be.exe.analytics.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Số liệu Outcome 3 (G3.1 - G3.4), tính trực tiếp từ DB, không nhập tay.
 * "Giao dịch" = payment BOOKING_CONNECTION đã nhận tiền (PAID / REFUND_PENDING / REFUNDED).
 * Doanh thu = tổng amount đã nhận trừ phần đã hoàn.
 */
public record Outcome3ReportResponse(
        Summary summary,
        Fairness fairness,
        Reviews reviews,
        List<ChannelRow> channels
) {

    /** G3.1 + G3.2: bốn chỉ số chính. */
    public record Summary(
            BigDecimal grossRevenue,
            BigDecimal refundedAmount,
            BigDecimal netRevenue,
            long totalUsers,
            long transactions,
            long paidCustomers,
            long reviews,
            BigDecimal averageOrderValue,
            long transactionThreshold,
            // % hoàn thành ngưỡng giao dịch (null nếu chưa cấu hình ngưỡng)
            Double thresholdProgressPercent
    ) {
    }

    /** G3.2: không có khách nào chiếm quá 20% giao dịch. */
    public record Fairness(
            long topCustomerTransactions,
            double topCustomerSharePercent,
            double maxAllowedSharePercent,
            boolean withinLimit
    ) {
    }

    /** G3.4: review xác thực và giữ chân khách. */
    public record Reviews(
            long reviewedPaidCustomers,
            // % khách đã trả tiền có review (mục tiêu >= 50%, tối thiểu 10 người)
            double reviewRatePercent,
            double averageRating,
            long repeatCustomers,
            double repeatPurchaseRatePercent
    ) {
    }

    /** G3.3: một dòng theo kênh UTM (utm_source + utm_medium). */
    public record ChannelRow(
            String source,
            String medium,
            long visits,
            long sessions,
            long signups,
            long paidCustomers,
            long transactions,
            BigDecimal revenue,
            // paidCustomers / signups (%)
            double signupToPaidPercent,
            // paidCustomers / sessions (%)
            double visitToPaidPercent,
            BigDecimal averageOrderValue
    ) {
    }

    /** Một giao dịch để đối soát với sao kê SePay / ngân hàng. */
    public record TransactionRow(
            Long paymentId,
            Long orderId,
            Long customerId,
            String customerName,
            String customerEmail,
            String customerPhone,
            String paymentMethod,
            String referenceCode,
            String gatewayTransactionId,
            BigDecimal amount,
            BigDecimal refundedAmount,
            String status,
            Instant paidAt
    ) {
    }
}
