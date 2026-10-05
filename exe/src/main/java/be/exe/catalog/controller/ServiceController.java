package be.exe.catalog.controller;

import be.exe.catalog.dto.request.CreateServiceRequest;
import be.exe.catalog.dto.request.UpdateServiceRequest;
import be.exe.catalog.dto.response.ServiceResponse;
import be.exe.catalog.service.ServiceCatalogService;
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
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    public ServiceController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @PostMapping("/api/salons/{salonId}/services")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<ServiceResponse>> createService(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long salonId,
            @Valid @RequestBody CreateServiceRequest request) {
        ServiceResponse response = serviceCatalogService.createService(
                salonId, principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Đã thêm dịch vụ", response));
    }

    @PutMapping("/api/services/{serviceId}")
    @PreAuthorize("hasRole('SALON_OWNER')")
    public ResponseEntity<ApiResponse<ServiceResponse>> updateService(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long serviceId,
            @Valid @RequestBody UpdateServiceRequest request) {
        ServiceResponse response = serviceCatalogService.updateService(
                serviceId, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/services/{serviceId}")
    public ResponseEntity<ApiResponse<ServiceResponse>> getService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(ApiResponse.success(serviceCatalogService.getService(serviceId)));
    }

    @GetMapping("/api/salons/{salonId}/services")
    public ResponseEntity<ApiResponse<PageResponse<ServiceResponse>>> getServicesBySalon(
            @PathVariable Long salonId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size);
        var result = serviceCatalogService.getServicesBySalon(salonId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}
