package be.exe.booking.domain.event;

import java.math.BigDecimal;

/**
 * Bắn ra sau khi tạo booking thành công (status = PENDING).
 * Module payment sẽ lắng nghe event này để tạo bản ghi payment tương ứng.
 */
public record BookingCreatedEvent(
        Long bookingId,
        Long customerId,
        Long salonId,
        BigDecimal totalAmount
) {
}
