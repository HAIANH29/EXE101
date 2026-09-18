package be.exe.payment.sepay;

import be.exe.common.util.HashUtils;
import org.springframework.stereotype.Component;

/**
 * SePay gửi kèm header "Authorization: Apikey <api_key_bạn_cấu_hình_trên_dashboard_SePay>"
 * trong mỗi lần gọi webhook. Verify bằng cách so sánh constant-time (chống timing attack),
 * tái sử dụng HashUtils.constantTimeEquals đã có sẵn ở common.
 */
@Component
public class SePayWebhookAuthenticator {

    private final SePayProperties properties;

    public SePayWebhookAuthenticator(SePayProperties properties) {
        this.properties = properties;
    }

    public boolean isValid(String authorizationHeader) {
        if (authorizationHeader == null) {
            return false;
        }
        String expected = "Apikey " + properties.getWebhookSecret();
        return HashUtils.constantTimeEquals(authorizationHeader, expected);
    }
}
