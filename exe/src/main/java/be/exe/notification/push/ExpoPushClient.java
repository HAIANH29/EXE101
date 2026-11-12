package be.exe.notification.push;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gọi Expo Push API (https://docs.expo.dev/push-notifications/sending-notifications/).
 * Expo chuyển tiếp sang FCM (Android) / APNs (iOS). Trả về danh sách token đã hết hiệu lực
 * (app bị gỡ, quyền bị thu hồi...) để caller xóa khỏi DB.
 */
@Component
public class ExpoPushClient {

    private static final Logger log = LoggerFactory.getLogger(ExpoPushClient.class);
    private static final int BATCH_SIZE = 100;

    private final HttpClient http;
    private final ObjectMapper mapper;
    private final String url;
    private final String accessToken;
    private final Duration timeout;

    public ExpoPushClient(ObjectMapper mapper,
                          @Value("${app.push.expo-url:https://exp.host/--/api/v2/push/send}") String url,
                          @Value("${app.push.expo-access-token:}") String accessToken,
                          @Value("${app.push.timeout-ms:10000}") int timeoutMs) {
        this.mapper = mapper;
        this.url = url;
        this.accessToken = accessToken;
        this.timeout = Duration.ofMillis(timeoutMs);
        this.http = HttpClient.newBuilder().connectTimeout(timeout).build();
    }

    public record Message(String to, String title, String body, Map<String, Object> data) {
    }

    /** @return các token Expo báo là không còn hợp lệ (DeviceNotRegistered) */
    public List<String> send(List<Message> messages) {
        List<String> invalid = new ArrayList<>();
        for (int i = 0; i < messages.size(); i += BATCH_SIZE) {
            List<Message> batch = messages.subList(i, Math.min(i + BATCH_SIZE, messages.size()));
            try {
                invalid.addAll(sendBatch(batch));
            } catch (Exception e) {
                log.warn("Gửi push qua Expo thất bại ({} tin): {}", batch.size(), e.toString());
            }
        }
        return invalid;
    }

    private List<String> sendBatch(List<Message> batch) throws Exception {
        List<Map<String, Object>> payload = new ArrayList<>();
        for (Message m : batch) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("to", m.to());
            item.put("title", m.title());
            item.put("body", m.body());
            item.put("sound", "default");
            item.put("channelId", "default");
            item.put("priority", "high");
            if (m.data() != null) {
                item.put("data", m.data());
            }
            payload.add(item);
        }

        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(url))
                .timeout(timeout)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)));
        if (StringUtils.hasText(accessToken)) {
            request.header("Authorization", "Bearer " + accessToken);
        }

        HttpResponse<String> response = http.send(request.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            log.warn("Expo push trả về HTTP {}: {}", response.statusCode(), response.body());
            return List.of();
        }

        List<String> invalid = new ArrayList<>();
        JsonNode data = mapper.readTree(response.body()).path("data");
        for (int i = 0; i < data.size() && i < batch.size(); i++) {
            JsonNode ticket = data.get(i);
            if (!"error".equals(ticket.path("status").asText())) {
                continue;
            }
            String error = ticket.path("details").path("error").asText();
            if ("DeviceNotRegistered".equals(error)) {
                invalid.add(batch.get(i).to());
            } else {
                log.warn("Expo push lỗi cho một thiết bị: {} ({})", ticket.path("message").asText(), error);
            }
        }
        return invalid;
    }
}
