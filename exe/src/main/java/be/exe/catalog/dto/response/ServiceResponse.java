package be.exe.catalog.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ServiceResponse(
        Long id,
        Long salonId,
        String name,
        String description,
        BigDecimal price,
        Integer durationMinutes,
        String status,
        Instant createdAt
) {
}
