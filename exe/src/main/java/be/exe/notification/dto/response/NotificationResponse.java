package be.exe.notification.dto.response;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String content,
        boolean read,
        Instant createdAt
) {
}
