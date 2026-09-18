package be.exe.booking.domain.event;

/**
 * Bắn ra khi booking chuyển PENDING -> CONFIRMED (thường do payment thành công).
 * Module notification lắng nghe để gửi thông báo "Đặt lịch thành công" cho khách.
 */
public record BookingConfirmedEvent(
        Long bookingId,
        Long customerId
) {
}
