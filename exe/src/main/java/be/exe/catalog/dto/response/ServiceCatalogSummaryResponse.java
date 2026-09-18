package be.exe.catalog.dto.response;

import java.math.BigDecimal;

/**
 * Dùng bởi module khác (booking) để lấy giá + thời lượng khi tạo lịch hẹn,
 * không trả về toàn bộ ServiceOffering entity.
 */
public record ServiceCatalogSummaryResponse(
        Long id,
        Long salonId,
        String name,
        BigDecimal price,
        Integer durationMinutes,
        String status
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
