package be.exe.auth.security;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Verify ID token do frontend gửi lên (sau khi người dùng đăng nhập Google bằng
 * Google Identity Services SDK ở phía frontend).
 *
 * Cách làm: gọi endpoint chính thức của Google (tokeninfo) để nhờ Google verify hộ,
 * thay vì tự cài thư viện google-api-client nặng nề để verify chữ ký JWT bằng tay.
 * Cách này đơn giản hơn nhiều, Google chính thức hỗ trợ dùng cho việc verify phía server.
 */
@Component
public class GoogleTokenVerifier {

    private final RestClient restClient = RestClient.create("https://oauth2.googleapis.com");

    @Value("${app.oauth2.google-client-id}")
    private String googleClientId;

    public GoogleProfile verify(String idToken) {
        TokenInfoResponse response;

        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(TokenInfoResponse.class);
        } catch (RestClientException e) {
            // Google trả lỗi 400 nếu token sai/hết hạn -> RestClient ném exception ở đây
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS,
                    "Google token không hợp lệ hoặc đã hết hạn");
        }

        if (response == null || !googleClientId.equals(response.aud())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS,
                    "Token này không thuộc ứng dụng của bạn");
        }

        if (!"true".equalsIgnoreCase(response.emailVerified())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS,
                    "Email Google chưa được xác minh");
        }

        return new GoogleProfile(response.email(), response.name(), response.picture());
    }

    public record GoogleProfile(String email, String fullName, String avatarUrl) {
    }

    /**
     * Response từ https://oauth2.googleapis.com/tokeninfo - chỉ khai báo field cần dùng,
     * Jackson tự bỏ qua các field khác không khai báo.
     */
    private record TokenInfoResponse(
            String aud,
            String email,
            @JsonProperty("email_verified") String emailVerified,
            String name,
            String picture
    ) {
    }
}
