package be.exe.tryon.client;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Objects;

@Component
public class AiTryOnClient {

    private final RestClient restClient;
    private final String internalToken;

    public AiTryOnClient(
            @Value("${app.ai.tryon.base-url}") String baseUrl,
            @Value("${app.ai.tryon.internal-token:}") String internalToken) {
        this.restClient = RestClient.builder().baseUrl(Objects.requireNonNull(baseUrl)).build();
        this.internalToken = internalToken;
    }

    /**
     * Gọi Python AI service để tính vị trí đặt tóc (KHÔNG ghép ảnh).
     * Trả về tọa độ overlay để FE tự dựng layer chỉnh sửa.
     */
    public AiOverlayResponse computeOverlay(String originalImageUrl,
                                            Long hairstyleId,
                                            String hairstyleImageUrl) {
        try {
                var request = restClient.post()
                    .uri("/tryon")
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON));

                if (!internalToken.isBlank()) {
                request.header("X-Internal-Token", internalToken);
                }

                AiOverlayResponse response = request
                    .body(new AiOverlayRequest(originalImageUrl, hairstyleId, hairstyleImageUrl))
                    .retrieve()
                    .body(AiOverlayResponse.class);
            return response;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED);
        }
    }

    record AiOverlayRequest(String imageUrl, Long hairstyleId, String hairstyleImageUrl) {
    }

    public record AiOverlayResponse(
            String hairstyleImageUrl,
            int x,
            int y,
            int width,
            int height
    ) {
    }
}
