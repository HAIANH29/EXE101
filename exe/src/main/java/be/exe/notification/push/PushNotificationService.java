package be.exe.notification.push;

import be.exe.common.exception.ValidationException;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Map;

/**
 * Thông báo đẩy ra màn hình điện thoại. Là kênh BỔ SUNG cho chuông trong app:
 * gửi bất đồng bộ sau khi transaction commit, mọi lỗi chỉ ghi log, không ảnh hưởng luồng nghiệp vụ.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final DevicePushTokenRepository tokens;
    private final ExpoPushClient client;
    private final boolean enabled;
    private final ThreadPoolTaskExecutor executor;

    public PushNotificationService(DevicePushTokenRepository tokens,
                                   ExpoPushClient client,
                                   @Value("${app.push.enabled:true}") boolean enabled) {
        this.tokens = tokens;
        this.client = client;
        this.enabled = enabled;

        ThreadPoolTaskExecutor pool = new ThreadPoolTaskExecutor();
        pool.setThreadNamePrefix("push-");
        pool.setCorePoolSize(1);
        pool.setMaxPoolSize(3);
        pool.setQueueCapacity(200);
        pool.setWaitForTasksToCompleteOnShutdown(true);
        pool.setAwaitTerminationSeconds(10);
        pool.initialize();
        this.executor = pool;
    }

    @PreDestroy
    void shutdown() {
        executor.shutdown();
    }

    /** Đăng ký (hoặc chuyển sang user hiện tại) token của thiết bị. */
    @Transactional
    public void register(Long userId, String token, String platform) {
        if (!isExpoToken(token)) {
            throw new ValidationException("Push token không hợp lệ");
        }
        DevicePushToken existing = tokens.findByToken(token).orElse(null);
        if (existing == null) {
            tokens.save(new DevicePushToken(userId, token, platform));
        } else {
            existing.assignTo(userId, platform);
        }
    }

    /** Hủy token khi đăng xuất, để máy không còn nhận thông báo của tài khoản cũ. */
    public void unregister(Long userId, String token) {
        tokens.deleteByTokenAndUser(token, userId);
    }

    /** Gửi sau khi transaction hiện tại commit (nếu có). */
    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        if (!enabled) {
            return;
        }
        Runnable task = () -> deliver(userId, title, body, data);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    submit(task);
                }
            });
        } else {
            submit(task);
        }
    }

    void deliver(Long userId, String title, String body, Map<String, Object> data) {
        try {
            List<String> userTokens = tokens.findByUserId(userId).stream()
                    .map(DevicePushToken::getToken)
                    .toList();
            if (userTokens.isEmpty()) {
                return;
            }
            List<ExpoPushClient.Message> messages = userTokens.stream()
                    .map(t -> new ExpoPushClient.Message(t, title, body, data))
                    .toList();
            List<String> invalid = client.send(messages);
            if (!invalid.isEmpty()) {
                tokens.deleteByTokens(invalid);
                log.info("Đã xóa {} push token hết hiệu lực của user {}", invalid.size(), userId);
            }
        } catch (Exception e) {
            log.warn("Không gửi được push cho user {}: {}", userId, e.toString());
        }
    }

    private void submit(Runnable task) {
        try {
            executor.execute(task);
        } catch (TaskRejectedException e) {
            log.warn("Hàng đợi push đầy, bỏ một thông báo đẩy");
        }
    }

    static boolean isExpoToken(String token) {
        return token != null && token.length() <= 255
                && (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
                && token.endsWith("]");
    }
}
