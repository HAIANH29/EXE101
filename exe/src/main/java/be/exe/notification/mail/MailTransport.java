package be.exe.notification.mail;

import java.util.List;

/**
 * Kênh gửi mail thực tế. Chỉ 1 implementation được bật tại một thời điểm,
 * chọn bằng biến môi trường MAIL_PROVIDER (smtp = Brevo SMTP | brevo = Brevo HTTP API).
 *
 * Lý do tách ra: Render free tier có thể chặn cổng SMTP (25/465/587), khi đó
 * phải chuyển sang gửi qua HTTP API (cổng 443) mà không phải sửa code nghiệp vụ.
 */
public interface MailTransport {

    /** Tên provider, dùng để log. */
    String name();

    /** Danh sách cấu hình còn thiếu; rỗng nghĩa là sẵn sàng gửi. */
    List<String> missingConfiguration();

    /** Gửi mail, ném {@link MailDeliveryException} nếu thất bại hoặc timeout. */
    void send(OutgoingEmail email);
}
