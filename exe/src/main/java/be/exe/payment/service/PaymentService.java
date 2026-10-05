package be.exe.payment.service;

import be.exe.payment.dto.response.PaymentResponse;
import be.exe.payment.sepay.SepayWebhookRequest;

import java.math.BigDecimal;

public interface PaymentService {

    /**
     * Gọi tự động khi booking mới được tạo (nghe BookingCreatedEvent) - KHÔNG phải API
     * cho client gọi trực tiếp.
     */
    void createPaymentForBooking(Long bookingId, BigDecimal amount);

    /**
     * Gọi tự động khi booking bị hủy (nghe BookingCancelledEvent) - hủy luôn payment
     * nếu đang PENDING (khách chưa kịp chuyển khoản).
     */
    void cancelPaymentForBooking(Long bookingId);

    /** Xử lý webhook thật từ SePay. */
    void handleSepayWebhook(SepayWebhookRequest payload);

    PaymentResponse getPaymentByBooking(Long bookingId, Long requesterId);

    PaymentResponse getPayment(Long paymentId, Long requesterId);

    PaymentResponse refundPayment(Long paymentId, BigDecimal refundAmount, String refundReference, String note, Long adminId);
}
