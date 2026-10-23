package be.exe.common.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String upload(MultipartFile file, String folder);

    /**
     * Upload ảnh từ URL công khai (VD: ảnh output tạm thời của Replicate) -> URL vĩnh viễn.
     */
    String uploadFromUrl(String sourceUrl, String folder);
}
