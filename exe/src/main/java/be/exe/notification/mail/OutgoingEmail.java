package be.exe.notification.mail;

/**
 * Nội dung một email cần gửi. htmlBody có thể chứa "cid:stylelock-logo";
 * mỗi transport tự xử lý logo theo cách phù hợp (inline CID cho SMTP, URL công khai cho HTTP API).
 */
public record OutgoingEmail(
        String fromEmail,
        String fromName,
        String to,
        String subject,
        String htmlBody,
        String textBody
) {
    public static final String LOGO_CID = "stylelock-logo";

    public boolean isHtml() {
        return htmlBody != null && !htmlBody.isBlank();
    }
}
