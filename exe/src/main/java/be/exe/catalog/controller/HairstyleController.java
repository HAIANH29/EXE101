package be.exe.catalog.controller;

import be.exe.catalog.dto.request.CreateHairstyleRequest;
import be.exe.catalog.dto.request.UpdateHairstyleRequest;
import be.exe.catalog.dto.response.HairstyleImageUploadResponse;
import be.exe.catalog.dto.response.HairstyleResponse;
import be.exe.catalog.service.HairstyleService;
import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class HairstyleController {

    private final HairstyleService hairstyleService;

    public HairstyleController(HairstyleService hairstyleService) {
        this.hairstyleService = hairstyleService;
    }

    @PostMapping("/api/catalog/hairstyles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HairstyleResponse>> createHairstyle(
            @Valid @RequestBody CreateHairstyleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
            "Đã thêm kiểu tóc vào danh mục chung", hairstyleService.createHairstyle(request)));
    }

    @PostMapping(value = "/api/catalog/hairstyles/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HairstyleImageUploadResponse>> uploadHairstyleImage(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã tải ảnh lên", hairstyleService.uploadImage(file)));
    }

    @PutMapping("/api/catalog/hairstyles/{hairstyleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HairstyleResponse>> updateHairstyle(
            @PathVariable Long hairstyleId,
            @Valid @RequestBody UpdateHairstyleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                hairstyleService.updateHairstyle(hairstyleId, request)));
    }

    @GetMapping("/api/catalog/hairstyles/{hairstyleId}")
    public ResponseEntity<ApiResponse<HairstyleResponse>> getHairstyle(@PathVariable Long hairstyleId) {
        return ResponseEntity.ok(ApiResponse.success(hairstyleService.getHairstyle(hairstyleId)));
    }

    @GetMapping("/api/catalog/hairstyles")
    public ResponseEntity<ApiResponse<PageResponse<HairstyleResponse>>> getHairstyles(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size);
        var result = hairstyleService.getHairstyles(categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PostMapping("/api/salons/{salonId}/hairstyles/{hairstyleId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<Void>> assignHairstyleToSalon(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @PathVariable Long hairstyleId) {
        hairstyleService.assignToSalon(salonId, hairstyleId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã thêm kiểu tóc vào salon"));
    }

    @DeleteMapping("/api/salons/{salonId}/hairstyles/{hairstyleId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<Void>> unassignHairstyleFromSalon(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @PathVariable Long hairstyleId) {
        hairstyleService.unassignFromSalon(salonId, hairstyleId, principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã gỡ kiểu tóc khỏi salon"));
    }

    @GetMapping("/api/salons/{salonId}/hairstyles")
    public ResponseEntity<ApiResponse<List<HairstyleResponse>>> getHairstylesBySalon(
            @PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.success(hairstyleService.getHairstylesBySalon(salonId)));
    }
}
