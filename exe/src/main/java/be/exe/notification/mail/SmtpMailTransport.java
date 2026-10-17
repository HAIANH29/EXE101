package be.exe.notification.mail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;

/**
 * Gửi qua SMTP (Brevo, cổng 587). Timeout được cấu hình ở
 * spring.mail.properties.mail.smtp.*timeout để không treo thread khi cổng bị chặn.
 *
 * Brevo SMTP dùng SMTP login và SMTP key riêng; không dùng BREVO_API_KEY.
 */
@Component
@ConditionalOnProperty(name = "app.mail.provider", havingValue = "smtp", matchIfMissing = true)
public class SmtpMailTransport implements MailTransport {

    private static final String LOGO_RESOURCE = "static/email/stylelock-logo-updated.png";

    private final JavaMailSender mailSender;
    private final String username;
    private final String password;

    public SmtpMailTransport(JavaMailSender mailSender,
                             @Value("${spring.mail.username:}") String username,
                             @Value("${spring.mail.password:}") String password) {
        this.mailSender = mailSender;
        this.username = username;
        this.password = password;
    }

    @Override
    public String name() {
        return "smtp";
    }

    @Override
    public List<String> missingConfiguration() {
        List<String> missing = new ArrayList<>();
        if (!StringUtils.hasText(username)) missing.add("MAIL_USERNAME");
        if (!StringUtils.hasText(password)) missing.add("MAIL_PASSWORD (Brevo SMTP key)");
        return missing;
    }

    @Override
    public void send(OutgoingEmail email) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(email.fromEmail(), email.fromName());
            helper.setTo(email.to());
            helper.setSubject(email.subject());
            if (email.isHtml()) {
                helper.setText(email.textBody() == null ? "" : email.textBody(), email.htmlBody());
                addInlineLogoIfNeeded(helper, email.htmlBody());
            } else {
                helper.setText(email.textBody() == null ? "" : email.textBody(), false);
            }
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException | MailException e) {
            throw new MailDeliveryException("SMTP gửi mail thất bại: " + e.getMessage(), e);
        }
    }

    private void addInlineLogoIfNeeded(MimeMessageHelper helper, String htmlBody) throws MessagingException {
        if (!htmlBody.contains("cid:" + OutgoingEmail.LOGO_CID)) {
            return;
        }
        ClassPathResource logo = new ClassPathResource(LOGO_RESOURCE);
        if (logo.exists()) {
            helper.addInline(OutgoingEmail.LOGO_CID, logo, "image/png");
        }
    }
}
