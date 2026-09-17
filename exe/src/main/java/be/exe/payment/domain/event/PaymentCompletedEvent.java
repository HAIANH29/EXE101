package be.exe.payment.domain.event;

import java.math.BigDecimal;

/**
 * Bắn ra khi webhook SePay xác nhận đã nhận đủ tiền.
 * Module booking lắng nghe để tự động chuyển booking PENDING -> CONFIRMED.
 */
public record PaymentCompletedEvent(
        Long paymentId,
        Long bookingId,
        BigDecimal amount
) {
}
