package be.exe.salon.dto.response;

import java.time.Instant;

public record StylistResponse(
        Long id,
        Long userId,
        Long salonId,
        String bio,
        Integer experienceYears,
        String status,
        Instant createdAt
) {
}
