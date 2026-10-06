package be.exe.tryon.dto;

public record TryOnResponseDto(
        Long requestId,
        String status,
        String resultImageUrl
) {
}
