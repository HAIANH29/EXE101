package be.exe.catalog.dto.response;

import java.time.Instant;
import java.util.List;

public record HairstyleResponse(
        Long id,
        Long categoryId,
        String name,
        String description,
        String imageUrl,
        List<String> imageUrls,
        String gender,
        String status,
        Instant createdAt
) {
}
