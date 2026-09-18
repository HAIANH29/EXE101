package be.exe.payment.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        Long bookingId,
        String provider,
        String transactionId,
        String referenceCode,
        BigDecimal amount,
        String status,
        String paymentUrl,
        Instant paidAt,
        Instant createdAt
) {
}
