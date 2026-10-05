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
    public String upload(byte[] bytes, String folder) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    bytes,
                    ObjectUtils.asMap("folder", folder)
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Upload ảnh thất bại");
        }
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        try {
            // Extract publicId from URL, e.g. https://res.cloudinary.com/.../image/upload/v1234567/folder/filename.jpg
            int uploadIndex = fileUrl.indexOf("/upload/");
            if (uploadIndex != -1) {
                String path = fileUrl.substring(uploadIndex + 8); // after /upload/
                // Skip the version part (e.g. v1234567/)
                int versionSlashIndex = path.indexOf('/');
                if (versionSlashIndex != -1) {
                    String publicIdWithExt = path.substring(versionSlashIndex + 1);
                    int dotIndex = publicIdWithExt.lastIndexOf('.');
                    String publicId = dotIndex != -1 ? publicIdWithExt.substring(0, dotIndex) : publicIdWithExt;
                    cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                }
            }
        } catch (Exception e) {
            // Do not block the main flow if delete fails
        }
    }
}
