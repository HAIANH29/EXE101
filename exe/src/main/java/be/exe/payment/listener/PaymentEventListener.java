package be.exe.payment.listener;

import be.exe.booking.domain.event.BookingCancelledEvent;
import be.exe.booking.domain.event.BookingCreatedEvent;
import be.exe.payment.service.PaymentService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Đây là ví dụ cụ thể cho cơ chế giao tiếp bất đồng bộ giữa các module qua domain event
 * (đã thiết kế sẵn từ lúc code module booking).
 *
 * Dùng @TransactionalEventListener(AFTER_COMMIT) thay vì @EventListener thông thường:
 * chỉ tạo Payment SAU KHI transaction tạo Booking đã commit thành công. Nếu dùng
 * @EventListener thường, code sẽ chạy TRONG CÙNG transaction với việc tạo booking -
 * nếu tạo payment lỗi vì lý do gì đó, sẽ vô tình rollback luôn cả booking, gây coupling
 * không mong muốn giữa 2 module.
 */
@Component
public class PaymentEventListener {

    private final PaymentService paymentService;

    public PaymentEventListener(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCreated(BookingCreatedEvent event) {
        paymentService.createPaymentForBooking(event.bookingId(), event.totalAmount());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBookingCancelled(BookingCancelledEvent event) {
        paymentService.cancelPaymentForBooking(event.bookingId());
    }
}
