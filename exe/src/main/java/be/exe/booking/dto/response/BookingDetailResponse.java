package be.exe.booking.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Dùng cho trang chi tiết booking - có thêm tên salon/dịch vụ/kiểu tóc
 * (lấy qua gọi SalonService/ServiceCatalogService/HairstyleService, KHÔNG JOIN DB trực tiếp).
 */
public record BookingDetailResponse(
        Long id,
        Long customerId,
        Long salonId,
        String salonName,
        String salonAddress,
        Long stylistId,
        String stylistName,
        Long serviceId,
        String serviceName,
        Long hairstyleId,
        String hairstyleName,
        Instant startAt,
        Instant endAt,
        String status,
        BigDecimal totalAmount,
        String note,
        Instant createdAt
) {
}
