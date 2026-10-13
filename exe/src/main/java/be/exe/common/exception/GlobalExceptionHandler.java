package be.exe.common.exception;

import be.exe.common.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.List;

/**
 * Bắt toàn bộ exception ném ra từ Controller/Service, chuyển thành ErrorResponse thống nhất.
 * Đây là nơi DUY NHẤT quyết định format lỗi trả về client trong toàn bộ hệ thống.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Bắt toàn bộ lỗi nghiệp vụ (BusinessException và các lớp con: ResourceNotFoundException,
     * ForbiddenException, UnauthorizedException, ValidationException...).
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex, HttpServletRequest request) {

        log.warn("BusinessException [{}]: {}", ex.getErrorCode().getCode(), ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                ex.getErrorCode().getCode(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus()).body(body);
    }

    /**
     * Lỗi validate tự động từ @Valid trên request DTO (@NotBlank, @Email, @Size...).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ErrorResponse.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();

        log.warn("Validation failed on {}: {}", request.getRequestURI(), fieldErrors);

        ErrorResponse body = new ErrorResponse(
                ErrorCode.VALIDATION_FAILED.getCode(),
                ErrorCode.VALIDATION_FAILED.getDefaultMessage(),
                request.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Sai email/password khi login (Spring Security ném ra).
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {

        ErrorResponse body = new ErrorResponse(
                ErrorCode.INVALID_CREDENTIALS.getCode(),
                ErrorCode.INVALID_CREDENTIALS.getDefaultMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    /**
     * Đã đăng nhập nhưng không đủ quyền (Spring Security @PreAuthorize ném ra).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        ErrorResponse body = new ErrorResponse(
                ErrorCode.FORBIDDEN.getCode(),
                ErrorCode.FORBIDDEN.getDefaultMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Bắt lỗi unique/exclusion constraint từ Database.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex, HttpServletRequest request) {

        log.warn("Data integrity violation at {}: {}", request.getRequestURI(), ex.getMessage());

        String message = ErrorCode.VALIDATION_FAILED.getDefaultMessage();
        String errorMsg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";

        if (errorMsg.contains("excl_stylist_overlap")) {
            message = "Stylist đã có lịch hẹn bận trong khoảng thời gian này. Vui lòng chọn khung giờ khác.";
        } else if (errorMsg.contains("users_email_key")) {
            message = "Email này đã được sử dụng.";
        } else if (errorMsg.contains("users_phone_key")) {
            message = "Số điện thoại này đã được sử dụng.";
        }

        ErrorResponse body = new ErrorResponse(
                ErrorCode.VALIDATION_FAILED.getCode(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MultipartException.class})
    public ResponseEntity<ErrorResponse> handleMultipartException(
            Exception ex, HttpServletRequest request) {

        log.warn("Multipart upload error at {}: {}", request.getRequestURI(), ex.getMessage());

        ErrorResponse body = new ErrorResponse(
                ErrorCode.TRYON_INVALID_FILE.getCode(),
                "Dữ liệu ảnh tải lên không hợp lệ hoặc thiếu file ảnh.",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Bắt tất cả lỗi còn lại không lường trước (NullPointerException, lỗi từ thư viện thứ 3...).
     * KHÔNG bao giờ để lộ ex.getMessage() gốc ra client vì có thể chứa thông tin nội bộ nhạy cảm.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error at {}: ", request.getRequestURI(), ex);

        ErrorResponse body = new ErrorResponse(
                ErrorCode.INTERNAL_ERROR.getCode(),
                ErrorCode.INTERNAL_ERROR.getDefaultMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
