package be.exe.notification.listener;

import be.exe.booking.domain.event.BookingCancelledEvent;
import be.exe.booking.domain.event.BookingCompletedEvent;
import be.exe.booking.domain.event.BookingConfirmedEvent;
import be.exe.booking.domain.event.BookingCreatedEvent;
import be.exe.booking.service.BookingService;
import be.exe.notification.domain.NotificationType;
import be.exe.notification.service.NotificationService;
import be.exe.payment.domain.event.PaymentCompletedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Đây chính là "đầu não" của module notification: mọi thông báo sinh ra đều xuất phát
 * từ đây, không có nơi nào khác trong hệ thống được phép gọi trực tiếp
 * NotificationService.send(). Muốn thêm loại thông báo mới, chỉ cần thêm 1 method
 * @TransactionalEventListener ở đây - không cần sửa code ở module booking/payment.
 *
 * Dùng AFTER_COMMIT cho mọi listener: đảm bảo transaction gốc (tạo booking, xác nhận
 * thanh toán...) đã ghi DB thành công rồi mới gửi thông báo - tránh trường hợp thông báo
 * "lịch hẹn đã tạo" gửi ra nhưng thực chất transaction tạo booking bị rollback.
 */
@Component
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final BookingService bookingService;

    public NotificationEventListener(NotificationService notificationService,
                                      BookingService bookingService) {
        this.notificationService = notificationService;
        this.bookingService = bookingService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCreated(BookingCreatedEvent event) {
        notificationService.send(
                event.customerId(),
                NotificationType.BOOKING_CREATED,
                "Đặt lịch thành công",
                "Lịch hẹn của bạn đã được tạo, vui lòng hoàn tất thanh toán để salon xác nhận."
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        notificationService.send(
                event.customerId(),
                NotificationType.BOOKING_CONFIRMED,
                "Lịch hẹn đã được xác nhận",
                "Salon đã xác nhận lịch hẹn của bạn. Hẹn gặp bạn đúng giờ nhé!"
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCancelled(BookingCancelledEvent event) {
        String reason = (event.reason() != null && !event.reason().isBlank())
                ? " Lý do: " + event.reason()
                : "";
        notificationService.send(
                event.customerId(),
                NotificationType.BOOKING_CANCELLED,
                "Lịch hẹn đã bị hủy",
                "Lịch hẹn của bạn đã được hủy." + reason
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCompleted(BookingCompletedEvent event) {
        notificationService.send(
                event.customerId(),
                NotificationType.BOOKING_COMPLETED,
                "Lịch hẹn đã hoàn tất",
                "Cảm ơn bạn đã sử dụng dịch vụ! Đừng quên để lại đánh giá cho salon nhé."
        );
    }

    /**
     * PaymentCompletedEvent không mang sẵn customerId (chỉ có bookingId), nên phải gọi
     * ngược sang BookingService để lấy - đúng nguyên tắc module boundary, không JOIN DB.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        Long customerId = bookingService.getBookingOrThrow(event.bookingId()).customerId();

        notificationService.send(
                customerId,
                NotificationType.PAYMENT_COMPLETED,
                "Thanh toán thành công",
                "Chúng tôi đã nhận được thanh toán " + event.amount() + "đ cho lịch hẹn của bạn."
        );
    }
}
