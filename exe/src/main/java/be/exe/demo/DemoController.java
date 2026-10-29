package be.exe.demo;

import be.exe.common.response.ApiResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.demo.dto.MaterializeDemoSalonRequest;
import be.exe.payment.dto.response.PaymentResponse;
import be.exe.payment.service.PaymentService;
import be.exe.salon.dto.response.SalonResponse;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
public class DemoController {

    private final DemoSalonService demoSalonService;
    private final PaymentService paymentService;

    public DemoController(DemoSalonService demoSalonService, PaymentService paymentService) {
        this.demoSalonService = demoSalonService;
        this.paymentService = paymentService;
    }

    @PostMapping("/salons/materialize")
    public ResponseEntity<ApiResponse<SalonResponse>> materializeSalon(
            @Valid @RequestBody MaterializeDemoSalonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Salon demo đã sẵn sàng để đặt lịch",
                        demoSalonService.materialize(request)));
    }

    @PostMapping("/payments/{paymentId}/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long paymentId) {
        return ResponseEntity.ok(ApiResponse.success("Thanh toán demo đã được xác nhận",
                paymentService.confirmDemoPayment(paymentId, principal.getUserId())));
    }
}
