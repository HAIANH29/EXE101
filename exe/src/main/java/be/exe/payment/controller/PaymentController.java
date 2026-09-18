package be.exe.payment.controller;

import be.exe.common.response.ApiResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.payment.dto.response.PaymentResponse;
import be.exe.payment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Khách xem thông tin thanh toán của booking mình vừa đặt (mã QR, mã tham chiếu, trạng thái).
     * Payment được TỰ ĐỘNG tạo ngay khi booking được tạo (nghe event), khách không cần
     * tự gọi API tạo payment.
     */
    @GetMapping("/api/bookings/{bookingId}/payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByBooking(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long bookingId) {
        PaymentResponse response = paymentService.getPaymentByBooking(bookingId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/payments/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable Long paymentId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getPayment(paymentId)));
    }
}
