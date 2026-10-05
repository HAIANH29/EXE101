package be.exe.salon.controller;

import be.exe.salon.dto.request.CreateStylistRequest;
import be.exe.salon.dto.request.UpdateStylistRequest;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.service.StylistService;
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

@RestController
public class StylistController {

    private final StylistService stylistService;

    public StylistController(StylistService stylistService) {
        this.stylistService = stylistService;
    }

    @PostMapping("/api/salons/{salonId}/stylists")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<StylistResponse>> createStylist(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @Valid @RequestBody CreateStylistRequest request) {
        StylistResponse response = stylistService.createStylist(salonId, principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Đã thêm stylist", response));
    }

    @PutMapping("/api/stylists/{stylistId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<StylistResponse>> updateStylist(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long stylistId,
            @Valid @RequestBody UpdateStylistRequest request) {
        StylistResponse response = stylistService.updateStylist(stylistId, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/stylists/{stylistId}")
    public ResponseEntity<ApiResponse<StylistResponse>> getStylist(@PathVariable Long stylistId) {
        return ResponseEntity.ok(ApiResponse.success(stylistService.getStylist(stylistId)));
    }

    @GetMapping("/api/salons/{salonId}/stylists")
    public ResponseEntity<ApiResponse<PageResponse<StylistResponse>>> getStylistsBySalon(
            @PathVariable Long salonId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size);
        var result = stylistService.getStylistsBySalon(salonId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}
