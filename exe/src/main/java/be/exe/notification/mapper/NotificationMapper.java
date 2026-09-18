package be.exe.notification.mapper;

import be.exe.notification.domain.Notification;
import be.exe.notification.dto.response.NotificationResponse;

public final class NotificationMapper {

    private NotificationMapper() {
    }

    public static NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getTitle(),
                notification.getContent(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
