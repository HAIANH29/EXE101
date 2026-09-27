package be.exe.tryon.controller;

import be.exe.common.response.ApiResponse;
import be.exe.tryon.dto.TryOnResponseDto;
import be.exe.tryon.service.TryOnService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TryOnResponseDto> tryOn(
            @RequestParam("image") MultipartFile image,
            @RequestParam("hairstyleId") Long hairstyleId,
            @AuthenticationPrincipal UserDetails user) {

        // TODO: thay bằng cách lấy userId thật từ UserPrincipal của bạn (xem file common/security)
        Long userId = null;

        TryOnResponseDto response = tryOnService.process(image, hairstyleId, userId);
        return ApiResponse.success("Thử tóc thành công", response);
    }
}
