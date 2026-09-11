package be.exe.common.exception;

/**
 * Dùng cho lỗi validate nghiệp vụ phức tạp mà @Valid/@NotNull không check được,
 * ví dụ: "ngày bắt đầu phải trước ngày kết thúc", "tổng % giảm giá không vượt quá 100".
 * Lỗi validate cơ bản trên field DTO (@NotBlank, @Email...) đã được Spring tự bắt qua
 * MethodArgumentNotValidException, xử lý riêng trong GlobalExceptionHandler.
 */
public class ValidationException extends BusinessException {

    public ValidationException(String message) {
        super(ErrorCode.VALIDATION_FAILED, message);
    }
}
