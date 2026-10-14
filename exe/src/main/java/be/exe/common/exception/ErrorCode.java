package be.exe.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // ===== Chung =====
    INTERNAL_ERROR("COMMON_001", "Đã có lỗi xảy ra, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_FAILED("COMMON_002", "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("COMMON_003", "Không tìm thấy dữ liệu", HttpStatus.NOT_FOUND),
    UNAUTHORIZED("COMMON_004", "Bạn chưa đăng nhập hoặc phiên đã hết hạn", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("COMMON_005", "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),

    // ===== Mail =====
    /** Gửi mail đang tắt hoặc thiếu cấu hình (MAIL_ENABLED, API key, SMTP user/pass...). */
    MAIL_SERVICE_UNAVAILABLE("MAIL_001", "Dịch vụ gửi email đang tạm ngưng, vui lòng thử lại sau", HttpStatus.SERVICE_UNAVAILABLE),
    /** Đã cố gửi nhưng nhà cung cấp mail trả lỗi / timeout (chỉ xảy ra ở luồng gửi đồng bộ). */
    MAIL_SEND_FAILED("MAIL_002", "Không gửi được email, vui lòng thử lại sau", HttpStatus.SERVICE_UNAVAILABLE),

    // ===== Auth =====
    EMAIL_ALREADY_EXISTS("AUTH_001", "Email đã được sử dụng", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("AUTH_002", "Email hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN("AUTH_003", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED("AUTH_004", "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    INVALID_PASSWORD_RESET_TOKEN("AUTH_005", "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    OTP_INVALID("AUTH_006", "Mã OTP không chính xác", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED("AUTH_007", "Mã OTP đã hết hạn, vui lòng yêu cầu mã mới", HttpStatus.BAD_REQUEST),
    OTP_RATE_LIMITED("AUTH_008", "Bạn yêu cầu mã OTP quá nhanh, vui lòng thử lại sau", HttpStatus.TOO_MANY_REQUESTS),
    OTP_TOO_MANY_ATTEMPTS("AUTH_009", "Bạn đã nhập sai OTP quá nhiều lần, vui lòng yêu cầu mã mới", HttpStatus.TOO_MANY_REQUESTS),

    // ===== Booking =====
    BOOKING_SLOT_UNAVAILABLE("BOOKING_001", "Khung giờ này đã có người đặt", HttpStatus.CONFLICT),
    BOOKING_CANNOT_CANCEL("BOOKING_002", "Không thể hủy lịch hẹn vào lúc này", HttpStatus.BAD_REQUEST),

    // ===== Payment =====
    PAYMENT_ALREADY_PAID("PAYMENT_001", "Đơn hàng này đã được thanh toán", HttpStatus.CONFLICT),
    PAYMENT_WEBHOOK_INVALID("PAYMENT_002", "Chữ ký webhook không hợp lệ", HttpStatus.BAD_REQUEST),

    // ===== TryOn =====
    TRYON_INVALID_FILE("TRYON_001", "File ảnh không hợp lệ", HttpStatus.BAD_REQUEST),
    TRYON_AI_SERVICE_FAILED("TRYON_002", "Xử lý thử tóc thất bại, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),
    TRYON_RESULT_NOT_FOUND("TRYON_003", "Không tìm thấy kết quả thử tóc", HttpStatus.NOT_FOUND),
    TRYON_REQUEST_NOT_READY("TRYON_004", "Yêu cầu thử tóc chưa sẵn sàng để lưu kết quả", HttpStatus.CONFLICT),
    TRYON_RESULT_ALREADY_EXISTS("TRYON_005", "Yêu cầu thử tóc đã có kết quả", HttpStatus.CONFLICT);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
