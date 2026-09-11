package be.exe.catalog.dto.response;

import java.time.Instant;

public record HairstyleResponse(
        Long id,
        Long categoryId,
        String name,
        String description,
        String imageUrl,
        String gender,
        String status,
        Instant createdAt
) {
}
