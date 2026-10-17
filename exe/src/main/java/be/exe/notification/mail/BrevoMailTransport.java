package be.exe.notification.mail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gửi qua Brevo Transactional Email HTTP API (cổng 443) - dùng khi hosting chặn SMTP.
 * Free tier Brevo: 300 mail/ngày, không bắt buộc có tên miền riêng
 * (chỉ cần xác minh địa chỉ người gửi MAIL_FROM trong dashboard Brevo).
 *
 * HTTP API không hỗ trợ ảnh inline CID, nên "cid:stylelock-logo" được thay bằng URL công khai
 * (MAIL_LOGO_URL, mặc định ${APP_PUBLIC_BASE_URL}/email/stylelock-logo-transparent.png).
 */
@Component
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "brevo")
public class BrevoMailTransport implements MailTransport {

    private final String apiKey;
    private final String logoUrl;
    private final RestClient restClient;

    public BrevoMailTransport(@Value("${app.mail.brevo.api-key:}") String apiKey,
                              @Value("${app.mail.brevo.base-url:https://api.brevo.com/v3}") String baseUrl,
                              @Value("${app.mail.logo-url:}") String logoUrl,
                              @Value("${app.mail.http-timeout-ms:10000}") int timeoutMs) {
        this.apiKey = apiKey;
        this.logoUrl = logoUrl;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMs);
        requestFactory.setReadTimeout(timeoutMs);

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .defaultHeader("api-key", apiKey)
                .build();
    }

    @Override
    public String name() {
        return "brevo";
    }

    @Override
    public List<String> missingConfiguration() {
        List<String> missing = new ArrayList<>();
        if (!StringUtils.hasText(apiKey)) missing.add("BREVO_API_KEY");
        return missing;
    }

    @Override
    public void send(OutgoingEmail email) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sender", Map.of("name", email.fromName(), "email", email.fromEmail()));
        body.put("to", List.of(Map.of("email", email.to())));
        body.put("subject", email.subject());
        if (email.isHtml()) {
            body.put("htmlContent", replaceInlineLogo(email.htmlBody()));
        }
        if (StringUtils.hasText(email.textBody())) {
            body.put("textContent", email.textBody());
        }

        try {
            restClient.post()
                    .uri("/smtp/email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new MailDeliveryException(
                    "Brevo trả lỗi HTTP " + e.getStatusCode().value() + ": " + e.getResponseBodyAsString(), e);
        } catch (RestClientException e) {
            throw new MailDeliveryException("Không kết nối được Brevo: " + e.getMessage(), e);
        }
    }

    private String replaceInlineLogo(String html) {
        String cid = "cid:" + OutgoingEmail.LOGO_CID;
        if (!html.contains(cid)) {
            return html;
        }
        return StringUtils.hasText(logoUrl) ? html.replace(cid, logoUrl) : html;
    }
}
