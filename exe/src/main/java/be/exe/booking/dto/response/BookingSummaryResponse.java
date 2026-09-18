package be.exe.booking.dto.response;

/**
 * Dùng bởi module khác (review, payment) - không trả về toàn bộ Booking entity.
 */
public record BookingSummaryResponse(
        Long id,
        Long customerId,
        Long salonId,
        String status
) {
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }
}
