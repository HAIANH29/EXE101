package be.exe.payment.domain;

public enum PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    CANCELLED,
    /** Booking đã thanh toán bị hủy, chờ admin hoàn tiền. */
    REFUND_PENDING,
    /** Admin đã xác nhận chuyển khoản hoàn tiền cho khách. */
    REFUNDED
}
