package be.exe.catalog.dto.response;

/**
 * Dùng bởi module khác (booking, tryon) - không trả về toàn bộ Hairstyle entity.
 */
public record HairstyleSummaryResponse(
        Long id,
        String name,
        String imageUrl,
        String status
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
