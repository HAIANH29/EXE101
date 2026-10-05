package be.exe.payment.domain.event;

import java.math.BigDecimal;

/**
 * Bắn ra khi booking đã thanh toán bị hủy - payment chuyển sang REFUND_PENDING,
 * chờ admin hoàn tiền thủ công (SePay chỉ theo dõi biến động số dư, không có API hoàn tiền).
 */
public record PaymentRefundRequestedEvent(
        Long paymentId,
        Long bookingId,
        BigDecimal amount
) {
}
