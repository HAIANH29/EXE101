package be.exe.booking.domain.event;

/**
 * Bắn ra khi lịch hẹn hoàn tất. Module review lắng nghe để mở quyền đánh giá (review)
 * cho khách hàng đối với booking này.
 */
public record BookingCompletedEvent(
        Long bookingId,
        Long customerId,
        Long salonId
) {
}
