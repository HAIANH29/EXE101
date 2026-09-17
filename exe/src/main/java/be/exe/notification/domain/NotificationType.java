package be.exe.notification.domain;

/**
 * Mỗi giá trị tương ứng với 1 domain event mà module notification lắng nghe.
 * Thêm loại thông báo mới = thêm 1 dòng ở đây + 1 method lắng nghe event tương ứng.
 */
public enum NotificationType {
    BOOKING_CREATED,
    BOOKING_CONFIRMED,
    BOOKING_CANCELLED,
    BOOKING_COMPLETED,
    PAYMENT_COMPLETED
}
