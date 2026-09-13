package be.exe.booking.domain.event;

/**
 * Bắn ra khi booking bị hủy. Module payment lắng nghe để xử lý hoàn tiền (nếu đã thanh toán),
 * module notification lắng nghe để báo cho khách/salon.
 */
public record BookingCancelledEvent(
        Long bookingId,
        Long customerId,
        String reason
) {
}
