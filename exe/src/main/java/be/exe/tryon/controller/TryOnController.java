package be.exe.tryon.controller;

import be.exe.common.response.ApiResponse;
import be.exe.tryon.dto.TryOnFinalizeResponseDto;
import be.exe.tryon.dto.TryOnResponseDto;
import be.exe.tryon.service.TryOnService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tryon")
public class TryOnController {

    private final TryOnService tryOnService;

    public TryOnController(TryOnService tryOnService) {
        this.tryOnService = tryOnService;
    }

    /**
     * Bước 1: upload ảnh khách + chọn mẫu tóc -> AI trả tọa độ overlay
     * để FE dựng layer cho khách chỉnh.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TryOnResponseDto> tryOn(
            @RequestParam("image") MultipartFile image,
            @RequestParam("hairstyleId") Long hairstyleId,
            @AuthenticationPrincipal UserDetails user) {

        // TODO: thay bằng cách lấy userId thật từ UserPrincipal của bạn
        Long userId = null;

        TryOnResponseDto response = tryOnService.process(image, hairstyleId, userId);
        return ApiResponse.success("Đã tính vị trí thử tóc, chờ khách chỉnh", response);
    }

    /**
     * Bước 2: khách chỉnh xong bên FE (kéo/resize/xoay), FE tự merge ảnh
     * bằng canvas rồi gửi file ảnh cuối lên đây để lưu kết quả.
     */
    @PutMapping(value = "/{requestId}/finalize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TryOnFinalizeResponseDto> finalize(
            @PathVariable Long requestId,
            @RequestParam("resultImage") MultipartFile resultImage) {

        TryOnFinalizeResponseDto response = tryOnService.finalize(requestId, resultImage);
        return ApiResponse.success("Lưu kết quả thử tóc thành công", response);
    }
}
