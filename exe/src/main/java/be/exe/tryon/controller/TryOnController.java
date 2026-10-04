package be.exe.tryon.controller;

import be.exe.common.response.ApiResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.response.PageResponse;
import be.exe.common.util.PaginationUtils;
import be.exe.tryon.dto.TryOnFinalizeResponseDto;
import be.exe.tryon.dto.TryOnResponseDto;
import be.exe.tryon.dto.TryOnResultResponseDto;
import be.exe.tryon.service.TryOnService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
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
    public ResponseEntity<ApiResponse<TryOnResponseDto>> tryOn(
            @RequestParam("image") MultipartFile image,
            @RequestParam("hairstyleId") Long hairstyleId,
            @AuthenticationPrincipal CustomUserDetails principal) {

            TryOnResponseDto response = tryOnService.process(image, hairstyleId, principal.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Đã tính vị trí thử tóc, chờ khách chỉnh", response));
    }

    /**
     * Bước 2: khách chỉnh xong bên FE (kéo/resize/xoay), FE tự merge ảnh
     * bằng canvas rồi gửi file ảnh cuối lên đây để lưu kết quả.
     */
    @PutMapping(value = "/{requestId}/finalize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TryOnFinalizeResponseDto> finalize(
                @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long requestId,
            @RequestParam("resultImage") MultipartFile resultImage) {

            TryOnFinalizeResponseDto response = tryOnService.finalize(
                    requestId, resultImage, principal.getUserId());
        return ApiResponse.success("Lưu kết quả thử tóc thành công", response);
    }

    @GetMapping("/{requestId}/result")
    public ApiResponse<TryOnResultResponseDto> getResult(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long requestId) {
        return ApiResponse.success(tryOnService.getResult(requestId, principal.getUserId()));
    }

    @GetMapping("/results")
    public ApiResponse<PageResponse<TryOnResultResponseDto>> getResults(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var result = tryOnService.getResults(
                principal.getUserId(), PaginationUtils.of(page, size));
        return ApiResponse.success(PageResponse.from(result));
    }
}
