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
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            String errorResponse = e.getResponseBodyAsString().toLowerCase();
            if (errorResponse.contains("no face detected") || errorResponse.contains("face not found")) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Không phát hiện thấy khuôn mặt trong ảnh, vui lòng chụp trực diện và rõ mặt hơn.");
            }
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED);
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

    public AiMergeResponse mergeImages(String imageUrl, String hairstyleImageUrl, int x, int y, int width, int height) {
        try {
            var request = restClient.post()
                .uri("/merge")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON));

            if (!internalToken.isBlank()) {
                request.header("X-Internal-Token", internalToken);
            }

            return request
                .body(new AiMergeRequest(imageUrl, hairstyleImageUrl, x, y, width, height))
                .retrieve()
                .body(AiMergeResponse.class);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED, "Quá trình ghép ảnh thất bại do ảnh đầu vào không hợp lệ.");
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED);
        }
    }

    record AiMergeRequest(String imageUrl, String hairstyleImageUrl, int x, int y, int width, int height) {}
    public record AiMergeResponse(String base64Image) {}
}
