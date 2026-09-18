package be.exe.notification.service;

import be.exe.notification.domain.NotificationType;
import be.exe.notification.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /**
     * Chỉ được gọi bởi các listener trong module này (nghe event từ booking/payment),
     * KHÔNG phải API cho client gọi trực tiếp - client không được tự ý gửi thông báo.
     */
    void send(Long userId, NotificationType type, String title, String content);

    Page<NotificationResponse> getMyNotifications(Long userId, Pageable pageable);

    long countUnread(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);
}
