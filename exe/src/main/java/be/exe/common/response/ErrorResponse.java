package be.exe.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Format chuẩn trả về khi có lỗi (exception), được tạo bởi GlobalExceptionHandler.
 * fieldErrors chỉ có giá trị khi lỗi validate (@Valid) trên request DTO.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success = false;
    private String errorCode;
    private String message;
    private Instant timestamp;
    private String path;
    private List<FieldError> fieldErrors;

    public ErrorResponse(String errorCode, String message, String path) {
        this.errorCode = errorCode;
        this.message = message;
        this.path = path;
        this.timestamp = Instant.now();
    }

    public ErrorResponse(String errorCode, String message, String path, List<FieldError> fieldErrors) {
        this(errorCode, message, path);
        this.fieldErrors = fieldErrors;
    }

    public record FieldError(String field, String message) {
    }

    public boolean isSuccess() {
        return success;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getMessage() {
        return message;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getPath() {
        return path;
    }

    public List<FieldError> getFieldErrors() {
        return fieldErrors;
    }
}
