package be.exe.catalog.service;

import be.exe.catalog.dto.request.CreateServiceRequest;
import be.exe.catalog.dto.request.UpdateServiceRequest;
import be.exe.catalog.dto.response.ServiceCatalogSummaryResponse;
import be.exe.catalog.dto.response.ServiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * "Public API" của phần ServiceOffering trong module catalog.
 * Module khác (booking) chỉ được gọi getServiceOrThrow, không đụng repository/entity trực tiếp.
 */
public interface ServiceCatalogService {

    /**
     * Dùng bởi booking module để lấy giá + thời lượng khi tạo lịch hẹn.
     * Ném ResourceNotFoundException nếu không tồn tại.
     */
    ServiceCatalogSummaryResponse getServiceOrThrow(Long serviceId);

    ServiceResponse createService(Long salonId, Long ownerId, CreateServiceRequest request);

    ServiceResponse updateService(Long serviceId, Long ownerId, UpdateServiceRequest request);

    ServiceResponse getService(Long serviceId);

    Page<ServiceResponse> getServicesBySalon(Long salonId, Pageable pageable);

    Page<ServiceResponse> getServicesBySalon(Long salonId, String status, Pageable pageable);

    /** Used by the admin approval workflow without leaking catalog repositories. */
    boolean hasActiveServices(Long salonId);
}
