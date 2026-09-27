package be.exe.tryon.validator;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Component
public class ImageFileValidator {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.TRYON_INVALID_FILE, "File ảnh không được để trống");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.TRYON_INVALID_FILE, "Kích thước ảnh vượt quá 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.TRYON_INVALID_FILE,
                    "Chỉ chấp nhận định dạng JPEG, PNG, WebP");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.contains("..")) {
            throw new BusinessException(ErrorCode.TRYON_INVALID_FILE, "Tên file không hợp lệ");
        }
    }
}
