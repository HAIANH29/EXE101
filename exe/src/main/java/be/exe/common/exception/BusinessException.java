package be.exe.common.exception;

/**
 * Exception gốc cho mọi lỗi nghiệp vụ (không phải lỗi hệ thống).
 * Các exception cụ thể (ResourceNotFoundException, ForbiddenException...) nên kế thừa từ đây,
 * hoặc dùng trực tiếp class này khi không cần loại riêng.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
