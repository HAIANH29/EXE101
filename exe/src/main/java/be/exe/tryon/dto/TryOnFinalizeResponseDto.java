package be.exe.tryon.dto;

/**
 * Trả về sau khi khách chỉnh xong và lưu ảnh kết quả cuối cùng.
 */
public record TryOnFinalizeResponseDto(
        Long requestId,
        String status,
        String resultImageUrl
) {
}
