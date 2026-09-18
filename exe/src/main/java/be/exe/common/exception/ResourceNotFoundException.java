package be.exe.common.exception;

/**
 * Ném ra khi không tìm thấy resource theo id/điều kiện tìm kiếm.
 * Ví dụ: bookingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking", id));
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(ErrorCode.RESOURCE_NOT_FOUND,
                String.format("%s không tồn tại với id/giá trị: %s", resourceName, identifier));
    }

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }
}
