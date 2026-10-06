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
     * Gọi Python AI service — AI sinh ảnh thật (qua Replicate), trả thẳng
     * URL ảnh kết quả đã lưu trên Cloudinary.
     */
    public String process(String originalImageUrl, Long hairstyleId) {
        try {
            AiTryOnResponse response = restClient.post()
                    .uri("/tryon")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new AiTryOnRequest(originalImageUrl, hairstyleId))
                    .retrieve()
                    .body(AiTryOnResponse.class);
            return response.resultImageUrl();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED);
        }
    }

    record AiTryOnRequest(String imageUrl, Long hairstyleId) {
    }

    record AiTryOnResponse(String resultImageUrl) {
    }
}
