package be.exe.notification.service.impl;

import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.notification.domain.Notification;
import be.exe.notification.domain.NotificationType;
import be.exe.notification.dto.response.NotificationResponse;
import be.exe.notification.mapper.NotificationMapper;
import be.exe.notification.repository.NotificationRepository;
import be.exe.notification.push.PushNotificationService;
import be.exe.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final PushNotificationService pushService;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   PushNotificationService pushService) {
        this.notificationRepository = notificationRepository;
        this.pushService = pushService;
    }

    @Override
    public void send(Long userId, NotificationType type, String title, String content) {
        Notification notification = new Notification(userId, type, title, content);
        notificationRepository.save(notification);
        // Đẩy thêm ra màn hình điện thoại (bất đồng bộ, sau commit, lỗi không ảnh hưởng thông báo trong app)
        pushService.sendToUser(userId, title, content,
                Map.of("type", type.name(), "notificationId", String.valueOf(notification.getId())));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.isOwnedBy(userId)) {
            throw new ForbiddenException("Bạn không phải chủ thông báo này");
        }

        notification.markAsRead();
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }
}
