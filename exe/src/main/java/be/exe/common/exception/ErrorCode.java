package be.exe.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Liệt kê toàn bộ mã lỗi nghiệp vụ trong hệ thống.
 * Mỗi module có thể thêm mã lỗi riêng vào đây (prefix theo tên module cho dễ tra).
 */
public enum ErrorCode {

    // ===== Chung =====
    INTERNAL_ERROR("COMMON_001", "Đã có lỗi xảy ra, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_FAILED("COMMON_002", "Dữ liệu không hợp lệ", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("COMMON_003", "Không tìm thấy dữ liệu", HttpStatus.NOT_FOUND),
    UNAUTHORIZED("COMMON_004", "Bạn chưa đăng nhập hoặc phiên đã hết hạn", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("COMMON_005", "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),

    // ===== Auth =====
    EMAIL_ALREADY_EXISTS("AUTH_001", "Email đã được sử dụng", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("AUTH_002", "Email hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN("AUTH_003", "Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    ACCOUNT_DISABLED("AUTH_004", "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),

    // ===== Booking =====
    BOOKING_SLOT_UNAVAILABLE("BOOKING_001", "Khung giờ này đã có người đặt", HttpStatus.CONFLICT),
    BOOKING_CANNOT_CANCEL("BOOKING_002", "Không thể hủy lịch hẹn vào lúc này", HttpStatus.BAD_REQUEST),

    // ===== Payment =====
    PAYMENT_ALREADY_PAID("PAYMENT_001", "Đơn hàng này đã được thanh toán", HttpStatus.CONFLICT),
    PAYMENT_WEBHOOK_INVALID("PAYMENT_002", "Chữ ký webhook không hợp lệ", HttpStatus.BAD_REQUEST),

    // ===== TryOn =====
    TRYON_INVALID_FILE("TRYON_001", "File ảnh không hợp lệ", HttpStatus.BAD_REQUEST),
    TRYON_AI_SERVICE_FAILED("TRYON_002", "Xử lý thử tóc thất bại, vui lòng thử lại", HttpStatus.INTERNAL_SERVER_ERROR),
    TRYON_RESULT_NOT_FOUND("TRYON_003", "Không tìm thấy kết quả thử tóc", HttpStatus.NOT_FOUND);

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
