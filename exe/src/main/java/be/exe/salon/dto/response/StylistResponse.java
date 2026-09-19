package be.exe.salon.dto.response;

import java.time.Instant;

public record StylistResponse(
        Long id,
        Long userId,
        String fullName,
        String avatarUrl,
        Long salonId,
        String bio,
        Integer experienceYears,
        String status,
        Instant createdAt
) {
}
