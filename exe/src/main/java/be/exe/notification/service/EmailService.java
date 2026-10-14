package be.exe.notification.service;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.notification.mail.MailDeliveryException;
import be.exe.notification.mail.MailTransport;
import be.exe.notification.mail.OutgoingEmail;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Điểm vào duy nhất để gửi email.
 *
 * - {@link #ensureReady()}: kiểm tra đồng bộ cấu hình mail (bật/tắt, credential) để báo lỗi
 *   MAIL_001 ngay cho client thay vì im lặng không gửi.
 * - {@link #sendHtmlEmailAsync}: gửi bất đồng bộ trên thread pool riêng, chỉ chạy SAU KHI
 *   transaction hiện tại commit (để token/OTP chắc chắn đã lưu DB). Request HTTP không phải
 *   chờ SMTP/HTTP API nên không bị treo khi nhà cung cấp chậm hoặc cổng bị chặn.
 * - {@link #sendHtmlEmail}: gửi đồng bộ (dùng khi thật sự cần biết kết quả), ném MAIL_002 nếu lỗi.
 *
 * Executor được tạo nội bộ (không đăng ký bean) để không thay thế executor mặc định của @Async.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final MailTransport transport;
    private final boolean mailEnabled;
    private final String fromEmail;
    private final String fromName;
    private final ThreadPoolTaskExecutor mailExecutor;

    public EmailService(MailTransport transport,
                        @Value("${app.mail.enabled:false}") boolean mailEnabled,
                        @Value("${app.mail.from:}") String fromEmail,
                        @Value("${app.mail.from-name:StyleLock}") String fromName,
                        @Value("${app.mail.async.core-pool-size:2}") int corePoolSize,
                        @Value("${app.mail.async.max-pool-size:4}") int maxPoolSize,
                        @Value("${app.mail.async.queue-capacity:200}") int queueCapacity) {
        this.transport = transport;
        this.mailEnabled = mailEnabled;
        this.fromEmail = fromEmail;
        this.fromName = fromName;

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("mail-");
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(15);
        executor.initialize();
        this.mailExecutor = executor;

        logger.info("EmailService khởi tạo: provider={}, enabled={}, from={}", transport.name(), mailEnabled, fromEmail);
    }

    @PreDestroy
    void shutdown() {
        mailExecutor.shutdown();
    }

    /**
     * Ném MAIL_001 nếu mail đang tắt hoặc thiếu cấu hình. Chi tiết cấu hình thiếu chỉ ghi log,
     * không trả về client.
     */
    public void ensureReady() {
        List<String> problems = new ArrayList<>();
        if (!mailEnabled) {
            problems.add("MAIL_ENABLED=false");
        }
        if (!StringUtils.hasText(fromEmail)) {
            problems.add("MAIL_FROM");
        }
        problems.addAll(transport.missingConfiguration());

        if (!problems.isEmpty()) {
            logger.error("Không thể gửi email qua provider '{}'. Thiếu/sai cấu hình: {}", transport.name(), problems);
            throw new BusinessException(ErrorCode.MAIL_SERVICE_UNAVAILABLE);
        }
    }

    /** Gửi bất đồng bộ sau khi transaction commit. Lỗi gửi chỉ được ghi log. */
    public void sendHtmlEmailAsync(String to, String subject, String htmlBody, String textFallback) {
        ensureReady();
        OutgoingEmail email = new OutgoingEmail(fromEmail, fromName, to, subject, htmlBody, textFallback);
        Runnable task = () -> deliverQuietly(email);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    submit(task, email);
                }
            });
        } else {
            submit(task, email);
        }
    }

    /** Gửi đồng bộ, ném MAIL_002 nếu thất bại. */
    public void sendHtmlEmail(String to, String subject, String htmlBody, String textFallback) {
        ensureReady();
        OutgoingEmail email = new OutgoingEmail(fromEmail, fromName, to, subject, htmlBody, textFallback);
        try {
            transport.send(email);
            logger.info("Đã gửi email '{}' tới {} qua {}", subject, to, transport.name());
        } catch (MailDeliveryException e) {
            logger.error("Gửi email '{}' tới {} thất bại: {}", subject, to, e.getMessage(), e);
            throw new BusinessException(ErrorCode.MAIL_SEND_FAILED);
        }
    }

    /** Gửi email text thuần (đồng bộ). */
    public void sendEmail(String to, String subject, String body) {
        sendHtmlEmail(to, subject, null, body);
    }

    private void submit(Runnable task, OutgoingEmail email) {
        try {
            mailExecutor.execute(task);
        } catch (TaskRejectedException e) {
            logger.error("Hàng đợi gửi mail đầy, bỏ email '{}' tới {}", email.subject(), email.to(), e);
        }
    }

    private void deliverQuietly(OutgoingEmail email) {
        try {
            transport.send(email);
            logger.info("Đã gửi email '{}' tới {} qua {}", email.subject(), email.to(), transport.name());
        } catch (Exception e) {
            logger.error("Gửi email '{}' tới {} qua {} thất bại: {}",
                    email.subject(), email.to(), transport.name(), e.getMessage(), e);
        }
    }
}
