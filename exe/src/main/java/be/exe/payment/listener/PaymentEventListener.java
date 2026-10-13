package be.exe.payment.listener;

import be.exe.booking.domain.event.BookingCancelledEvent;
import be.exe.booking.domain.event.BookingCreatedEvent;
import be.exe.payment.service.PaymentService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
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
 *
 * Bắt buộc dùng REQUIRES_NEW: ở pha AFTER_COMMIT transaction gốc đã commit nhưng
 * resource vẫn còn bind vào thread - nếu service chạy với REQUIRED, nó sẽ "tham gia"
 * transaction đã commit đó và thay đổi có thể không bao giờ được ghi xuống DB.
 */
@Component
public class PaymentEventListener {

    private final PaymentService paymentService;

    public PaymentEventListener(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingCreated(BookingCreatedEvent event) {
        paymentService.createPaymentForBooking(event.bookingId(), event.customerId(), event.salonId(),
                event.totalAmount());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingCancelled(BookingCancelledEvent event) {
        paymentService.cancelPaymentForBooking(event.bookingId());
    }
}
