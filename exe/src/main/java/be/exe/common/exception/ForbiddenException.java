package be.exe.common.exception;

/**
 * Ném ra khi user đã xác thực thành công nhưng không có quyền thực hiện hành động
 * (ví dụ: CUSTOMER cố gọi API dành cho ADMIN, hoặc stylist cố sửa booking của salon khác).
 */
public class ForbiddenException extends BusinessException {

    public ForbiddenException() {
        super(ErrorCode.FORBIDDEN);
    }

    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }
}
