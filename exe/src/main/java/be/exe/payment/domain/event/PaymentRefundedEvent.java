package be.exe.payment.domain.event;

import java.math.BigDecimal;

/** Bắn ra khi admin xác nhận đã chuyển khoản hoàn tiền cho khách. */
public record PaymentRefundedEvent(
        Long paymentId,
        Long bookingId,
        BigDecimal refundAmount
) {
}
