package be.exe.notification.mail;

/** Lỗi khi transport gửi mail thất bại (kết nối, timeout, provider từ chối...). */
public class MailDeliveryException extends RuntimeException {

    public MailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }

    public MailDeliveryException(String message) {
        super(message);
    }
}
