package be.exe.salon.controller;

import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.request.CreateSalonRequest;
import be.exe.salon.dto.request.UpdateBusinessHourRequest;
import be.exe.salon.dto.request.UpdateSalonRequest;
import be.exe.salon.dto.request.UpdateSalonStatusRequest;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.service.SalonService;
import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/salons")
public class SalonController {

    private final SalonService salonService;

    public SalonController(SalonService salonService) {
        this.salonService = salonService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SalonResponse>> createSalon(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateSalonRequest request) {
        SalonResponse response = salonService.createSalon(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
            "Đã tạo salon, đang chờ admin duyệt", response));
    }

    @PutMapping("/{salonId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<SalonResponse>> updateSalon(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @Valid @RequestBody UpdateSalonRequest request) {
        SalonResponse response = salonService.updateSalon(salonId, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{salonId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SalonResponse>> updateSalonStatus(
            @PathVariable Long salonId,
            @Valid @RequestBody UpdateSalonStatusRequest request) {
        SalonResponse response = salonService.updateSalonStatus(
                salonId, SalonStatus.valueOf(request.getStatus()));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{salonId}")
    public ResponseEntity<ApiResponse<SalonDetailResponse>> getSalonDetail(
            @PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.success(salonService.getSalonDetail(salonId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<SalonResponse>>> getSalons(
            @RequestParam(required = false) SalonStatus status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size);
        var result = salonService.getSalons(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/my-salons")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<PageResponse<SalonResponse>>> getMySalons(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size);
        var result = salonService.getSalonsByOwner(principal.getUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PutMapping("/{salonId}/business-hours")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<Void>> updateBusinessHours(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @Valid @RequestBody List<UpdateBusinessHourRequest> requests) {
        salonService.updateBusinessHours(salonId, principal.getUserId(), requests);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật giờ mở cửa"));
    }
}
