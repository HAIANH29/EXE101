package be.exe.payment.controller;

import be.exe.payment.sepay.SePayWebhookAuthenticator;
import be.exe.payment.sepay.SepayWebhookRequest;
import be.exe.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint PUBLIC (không cần JWT) - đã khai báo permitAll trong SecurityConfig
 * ("/api/payment/webhook/**"). Bảo mật ở đây KHÔNG dựa vào JWT mà dựa vào việc verify
 * header Authorization đúng API key đã cấu hình trên dashboard SePay.
 */
@RestController
public class SepayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(SepayWebhookController.class);

    private final PaymentService paymentService;
    private final SePayWebhookAuthenticator webhookAuthenticator;

    public SepayWebhookController(PaymentService paymentService,
                                   SePayWebhookAuthenticator webhookAuthenticator) {
        this.paymentService = paymentService;
        this.webhookAuthenticator = webhookAuthenticator;
    }

    @PostMapping("/api/payment/webhook/sepay")
    public ResponseEntity<String> handleWebhook(
            HttpServletRequest request,
            @RequestBody SepayWebhookRequest payload) {

        String authHeader = request.getHeader("Authorization");

        if (!webhookAuthenticator.isValid(authHeader)) {
            log.warn("Webhook SePay bị từ chối - sai Authorization header");
            // Trả 401 để SePay biết request bị từ chối do auth, không phải lỗi xử lý
            return ResponseEntity.status(401).body("Unauthorized");
        }

        paymentService.handleSepayWebhook(payload);

        // SePay yêu cầu trả về đúng format {"success": true} để xác nhận đã nhận webhook
        return ResponseEntity.ok("{\"success\": true}");
    }
}
