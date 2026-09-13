package be.exe.booking.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record BookingResponse(
        Long id,
        Long customerId,
        Long salonId,
        Long stylistId,
        Long serviceId,
        Long hairstyleId,
        Instant startAt,
        Instant endAt,
        String status,
        BigDecimal totalAmount,
        String note,
        Instant createdAt
) {
}
