package be.exe.notification.service;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.password-reset.mail-enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${app.password-reset.mail-from:${spring.mail.username:}}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String body) {
        logger.info("=== EMAIL PREVIEW ===");
        logger.info("To: {}", to);
        logger.info("Subject: {}", subject);
        logger.info("Body: {}", body);
        logger.info("=====================");

        validateMailConfig();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(resolveFromEmail());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
        logger.info("Sent email to {}", to);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody, String textFallback) {
        logger.info("=== HTML EMAIL PREVIEW ===");
        logger.info("To: {}", to);
        logger.info("Subject: {}", subject);
        logger.info("Text fallback: {}", textFallback);
        logger.info("==========================");

        validateMailConfig();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(resolveFromEmail());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textFallback, htmlBody);
            mailSender.send(message);
            logger.info("Sent HTML email to {}", to);
        } catch (MessagingException e) {
            throw new BusinessException(
                    ErrorCode.EMAIL_SEND_FAILED,
                    "Không tạo được nội dung email HTML. Vui lòng kiểm tra cấu hình mail."
            );
        }
    }

    private void validateMailConfig() {
        if (!mailEnabled) {
            throw new BusinessException(
                    ErrorCode.EMAIL_SEND_FAILED,
                    "Email thật đang tắt. Set PASSWORD_RESET_MAIL_ENABLED=true và cấu hình MAIL_USERNAME/MAIL_PASSWORD."
            );
        }

        if (!StringUtils.hasText(mailUsername) || !StringUtils.hasText(mailPassword)) {
            throw new BusinessException(
                    ErrorCode.EMAIL_SEND_FAILED,
                    "Thiếu MAIL_USERNAME hoặc MAIL_PASSWORD. Gmail cần dùng App Password, không dùng mật khẩu đăng nhập thường."
            );
        }
    }

    private String resolveFromEmail() {
        return StringUtils.hasText(fromEmail) ? fromEmail : mailUsername;
    }
}
