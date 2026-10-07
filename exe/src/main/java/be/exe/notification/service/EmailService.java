package be.exe.notification.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    // Gmail SMTP bắt buộc From trùng (hoặc là alias) của MAIL_USERNAME
    @Value("${app.password-reset.mail-from:}")
    private String fromEmail;

    @Value("${app.password-reset.mail-enabled:false}")
    private boolean mailEnabled;

    @Async
    public void sendEmail(String to, String subject, String body) {
        if (!mailEnabled) {
            // Fallback if mail is disabled: just log the email (mock mode)
            logger.info("=== MOCK EMAIL (PASSWORD_RESET_MAIL_ENABLED=false) ===");
            logger.info("To: {}", to);
            logger.info("Subject: {}", subject);
            logger.info("Body: {}", body);
            logger.info("==================");
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Sent email to {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}", to, e);
        }
    }
}
