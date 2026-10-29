package be.exe.payment.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thống kê thanh toán theo khách hàng dành cho màn hình quản trị.
 * Chỉ tổng hợp các giao dịch đã từng được thanh toán (PAID/REFUND_PENDING/REFUNDED).
 */
public record PaidUserResponse(
        Long customerId,
        String fullName,
        String email,
        String phone,
        long paidTransactionCount,
        BigDecimal totalPaidAmount,
        BigDecimal totalRefundedAmount,
        Instant lastPaidAt,
        Long latestPaymentId
) {
}
