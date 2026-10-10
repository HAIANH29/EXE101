package be.exe.tryon.client;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.storage.StorageService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Gọi AI model trên Replicate để thử kiểu tóc và màu tóc.
 * Hỗ trợ linh hoạt:
 * 1. google/nano-banana-2.1 (Gemini Image model thế hệ mới, nhanh và giữ nét khuôn mặt)
 * 2. subhash25rawat/custom-hair (HairFastGAN: StyleGAN2 Latent Blending)
 */
@Component
public class AiTryOnClient {

    private static final Logger log = LoggerFactory.getLogger(AiTryOnClient.class);

    private static final String RESULT_FOLDER = "tryon/results";
    private static final long MAX_WAIT_MS = 5 * 60 * 1000L;
    private static final long POLL_INTERVAL_MS = 2_000L;
    private static final Set<String> TERMINAL_STATUSES = Set.of("succeeded", "failed", "canceled");

    // Ảnh mẫu tóc mặc định chất lượng cao, góc nhìn thẳng cận mặt chuẩn cho AI
    private static final Map<Long, String> HAIRSTYLE_TEMPLATES = Map.of(
            1L, "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1024",
            2L, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1024",
            3L, "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1024",
            4L, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1024",
            5L, "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1024"
    );

    private final RestClient restClient;
    private final StorageService storageService;
    private final String apiToken;
    private final String rawHairModel;
    private final String modelVersion;
    private final boolean isOfficialModel;
    private final boolean isNanoBanana;

    public AiTryOnClient(StorageService storageService,
                         @Value("${app.ai.replicate.api-token:}") String apiToken,
                         @Value("${app.ai.replicate.hair-model}") String hairModel) {
        this.storageService = storageService;
        this.apiToken = apiToken;
        this.rawHairModel = hairModel.trim();
        this.isNanoBanana = this.rawHairModel.toLowerCase().contains("nano-banana");
        
        // Official model dạng "owner/model-name" không có ":versionHash"
        if (this.rawHairModel.contains("/") && !this.rawHairModel.contains(":")) {
            this.isOfficialModel = true;
            this.modelVersion = null;
        } else {
            this.isOfficialModel = false;
            this.modelVersion = this.rawHairModel.contains(":")
                    ? this.rawHairModel.substring(this.rawHairModel.indexOf(':') + 1)
                    : this.rawHairModel;
        }

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15_000);
        factory.setReadTimeout(90_000); // > Prefer: wait=60
        this.restClient = RestClient.builder()
                .baseUrl("https://api.replicate.com/v1")
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiToken)
                .build();
    }

    public String process(String originalImageUrl, Long hairstyleId) {
        return process(originalImageUrl, hairstyleId, null, null);
    }

    /**
     * @param faceImageUrl  ảnh khuôn mặt khách (đã upload Cloudinary)
     * @param hairImageUrl  ảnh mẫu kiểu tóc (shape reference); null -> template theo hairstyleId
     * @param colorImageUrl ảnh mẫu màu tóc (color reference); null -> lấy màu từ ảnh mẫu tóc
     * @return URL Cloudinary của ảnh kết quả
     */
    public String process(String faceImageUrl, Long hairstyleId, String hairImageUrl, String colorImageUrl) {
        if (apiToken == null || apiToken.isBlank()) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED,
                    "Thiếu REPLICATE_API_TOKEN trong exe/.env");
        }

        String hairUrl = isBlank(hairImageUrl)
                ? HAIRSTYLE_TEMPLATES.getOrDefault(hairstyleId, HAIRSTYLE_TEMPLATES.get(1L))
                : hairImageUrl;
        String colorUrl = isBlank(colorImageUrl) ? hairUrl : colorImageUrl;

        try {
            String replicateOutputUrl = runPrediction(faceImageUrl, hairUrl, colorUrl);
            return storageService.uploadFromUrl(replicateOutputUrl, RESULT_FOLDER);
        } catch (BusinessException e) {
            throw e;
        } catch (RestClientResponseException e) {
            log.error("Replicate API error {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            String hint = e.getStatusCode().value() == 401 ? " (REPLICATE_API_TOKEN sai/hết hạn)"
                    : e.getStatusCode().value() == 402 ? " (tài khoản Replicate hết credit)" : "";
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED,
                    "Replicate lỗi HTTP " + e.getStatusCode().value() + hint);
        } catch (ResourceAccessException e) {
            log.error("Cannot reach Replicate", e);
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED,
                    "Không kết nối được Replicate, kiểm tra mạng rồi thử lại");
        } catch (Exception e) {
            log.error("AI try-on failed", e);
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED);
        }
    }

    private String runPrediction(String faceUrl, String hairUrl, String colorUrl) throws InterruptedException {
        Map<String, Object> input = new LinkedHashMap<>();

        if (isNanoBanana) {
            List<String> images = new ArrayList<>();
            images.add(faceUrl);
            if (!isBlank(hairUrl)) images.add(hairUrl);
            if (!isBlank(colorUrl) && !colorUrl.equals(hairUrl)) images.add(colorUrl);

            input.put("prompt", "Realistic hair salon virtual try-on: replace the person's hair in the first image with the hairstyle and hair color from the reference images. Blend naturally along the hairline. Keep the person's facial identity, facial features, skin tone, facial expression, body, clothing, and background completely unchanged.");
            input.put("image_input", images);
            input.put("aspect_ratio", "match_input_image");
            input.put("resolution", "1K");
            input.put("output_format", "jpg");
        } else {
            input.put("face_image", faceUrl);
            input.put("hair_image", hairUrl);
            input.put("color_image", colorUrl);
        }

        log.info("Replicate AI Try-On start [model={}]: face={} hair={} color={}", rawHairModel, faceUrl, hairUrl, colorUrl);

        String createUri;
        Map<String, Object> requestBody = new LinkedHashMap<>();
        if (isOfficialModel) {
            createUri = "/models/" + rawHairModel + "/predictions";
            requestBody.put("input", input);
        } else {
            createUri = "/predictions";
            requestBody.put("version", modelVersion);
            requestBody.put("input", input);
        }

        // Prefer: wait=60 -> Replicate giữ kết nối tối đa 60s, trả kết quả luôn nếu model đã sẵn sàng.
        JsonNode prediction = restClient.post()
                .uri(createUri)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Prefer", "wait=60")
                .body(requestBody)
                .retrieve()
                .body(JsonNode.class);

        long deadline = System.currentTimeMillis() + MAX_WAIT_MS;
        while (prediction != null && !TERMINAL_STATUSES.contains(prediction.path("status").asText())) {
            if (System.currentTimeMillis() > deadline) {
                throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED,
                        "AI xử lý quá lâu, vui lòng thử lại");
            }
            Thread.sleep(POLL_INTERVAL_MS);
            prediction = restClient.get()
                    .uri("/predictions/{id}", prediction.path("id").asText())
                    .retrieve()
                    .body(JsonNode.class);
        }

        if (prediction == null) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED, "Replicate không phản hồi");
        }
        String status = prediction.path("status").asText();
        if (!"succeeded".equals(status)) {
            String error = prediction.path("error").asText("");
            log.error("Replicate prediction {} {}: {}", prediction.path("id").asText(), status, error);
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED,
                    "AI không tạo được ảnh" + (error.isBlank() ? "" : ": " + error)
                            + ". Hãy dùng ảnh mặt chụp thẳng, rõ nét, cắt khung gần.");
        }

        String outputUrl = extractOutputUrl(prediction.path("output"));
        if (isBlank(outputUrl)) {
            throw new BusinessException(ErrorCode.TRYON_AI_SERVICE_FAILED, "AI không trả về ảnh kết quả");
        }
        log.info("Replicate AI Try-On done: {}", outputUrl);
        return outputUrl;
    }

    /** Output có thể là "url", ["url", ...] hoặc {"image": "url"} tùy model. */
    private static String extractOutputUrl(JsonNode output) {
        if (output == null || output.isNull() || output.isMissingNode()) return null;
        if (output.isTextual()) return output.asText();
        if (output.isArray()) return output.isEmpty() ? null : extractOutputUrl(output.get(output.size() - 1));
        if (output.isObject()) {
            for (String key : new String[]{"image", "output", "result", "url"}) {
                if (output.has(key)) return extractOutputUrl(output.get(key));
            }
        }
        return null;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
