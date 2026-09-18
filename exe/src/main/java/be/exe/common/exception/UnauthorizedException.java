package be.exe.common.exception;

/**
 * Ném ra khi request chưa xác thực được danh tính (thiếu token, token sai/hết hạn).
 * Khác với ForbiddenException: cái này là "chưa biết anh là ai", còn Forbidden là "biết anh là ai rồi nhưng không đủ quyền".
 */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException() {
        super(ErrorCode.UNAUTHORIZED);
    }

    public UnauthorizedException(String message) {
        super(ErrorCode.UNAUTHORIZED, message);
    }
}
