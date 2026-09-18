package be.exe.salon.dto.response;

import java.time.Instant;

public record SalonResponse(
        Long id,
        Long ownerId,
        String name,
        String phone,
        String address,
        String description,
        String imageUrl,
        String status,
        Instant createdAt
) {
}
