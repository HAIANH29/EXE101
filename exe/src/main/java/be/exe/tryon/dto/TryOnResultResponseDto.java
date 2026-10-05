package be.exe.tryon.dto;

import java.time.OffsetDateTime;

public record TryOnResultResponseDto(
        Long requestId,
        String status,
        String resultImageUrl,
        OffsetDateTime createdAt
) {
}
