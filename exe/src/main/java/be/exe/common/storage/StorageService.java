package be.exe.common.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
    String upload(MultipartFile file, String folder);
    String upload(byte[] bytes, String folder);
    void delete(String fileUrl);
}
