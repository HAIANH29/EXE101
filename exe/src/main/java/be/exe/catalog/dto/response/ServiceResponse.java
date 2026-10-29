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
        String imageUrl,
        String status,
        Instant createdAt
) {
    public ServiceResponse(
            Long id,
            Long salonId,
            String name,
            String description,
            BigDecimal price,
            Integer durationMinutes,
            String status,
            Instant createdAt
    ) {
        this(id, salonId, name, description, price, durationMinutes, null, status, createdAt);
    }
}
