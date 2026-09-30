package be.exe.tryon.client;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiTryOnClient {

    private final RestClient restClient;

    public AiTryOnClient(@Value("${app.ai.tryon.base-url}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    /**
     * Gọi Python AI service để tính vị trí đặt tóc (KHÔNG ghép ảnh).
     * Trả về tọa độ overlay để FE tự dựng layer chỉnh sửa.
     */
    public AiOverlayResponse computeOverlay(String originalImageUrl, Long hairstyleId) {
        try {
            AiOverlayResponse response = restClient.post()
                    .uri("/tryon")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new AiOverlayRequest(originalImageUrl, hairstyleId))
                    .retrieve()
                    .body(AiOverlayResponse.class);
            return response;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED);
        }
    }

    record AiOverlayRequest(String imageUrl, Long hairstyleId) {
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
