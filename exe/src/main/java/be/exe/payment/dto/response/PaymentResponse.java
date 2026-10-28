package be.exe.payment.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        Long bookingId,
        Long salonId,
        String paymentType,
        BigDecimal serviceAmount,
        BigDecimal feeAmount,
        String provider,
        String transactionId,
        String referenceCode,
        BigDecimal amount,
        String status,
        String paymentUrl,
        Instant paidAt,
        Instant createdAt,
        BigDecimal refundAmount,
        String refundReason,
        String refundReference,
        Instant refundRequestedAt,
        Instant refundedAt,
        Long customerId
) {
}
