package be.exe.common.storage;

import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryStorageService implements StorageService {

    private final Cloudinary cloudinary;

    public CloudinaryStorageService(
            @Value("${app.cloudinary.cloud-name}") String cloudName,
            @Value("${app.cloudinary.api-key}") String apiKey,
            @Value("${app.cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    @Override
    public String upload(MultipartFile file, String folder) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", folder)
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Upload ảnh thất bại");
        }
    }

    @Override
    public String uploadFromUrl(String sourceUrl, String folder) {
        try {
            // Cloudinary tự tải ảnh từ URL nguồn, backend không cần download bytes.
            Map<?, ?> result = cloudinary.uploader().upload(
                    sourceUrl,
                    ObjectUtils.asMap("folder", folder, "resource_type", "image")
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Upload ảnh kết quả thất bại");
        }
    }
}
