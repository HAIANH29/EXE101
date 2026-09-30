package be.exe.tryon.dto;

/**
 * Trả về sau bước AI tính overlay (chưa phải ảnh cuối) — FE dùng để dựng
 * layer tóc đè lên ảnh gốc cho khách kéo/resize/xoay chỉnh lại.
 */
public record TryOnResponseDto(
        Long requestId,
        String status,
        String hairstyleImageUrl,
        int x,
        int y,
        int width,
        int height
) {
}
