package be.exe.booking.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record BookingResponse(
        Long id,
        Long customerId,
        Long salonId,
        String salonName,
        String salonAddress,
        Long stylistId,
        String stylistName,
        Long serviceId,
        String serviceName,
        Long hairstyleId,
        String hairstyleName,
        Instant startAt,
        Instant endAt,
        String status,
        BigDecimal totalAmount,
        String note,
        Instant createdAt
) {
}
