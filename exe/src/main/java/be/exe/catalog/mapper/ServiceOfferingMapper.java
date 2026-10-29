package be.exe.catalog.mapper;

import be.exe.catalog.domain.ServiceOffering;
import be.exe.catalog.dto.response.ServiceCatalogSummaryResponse;
import be.exe.catalog.dto.response.ServiceResponse;

public final class ServiceOfferingMapper {

    private ServiceOfferingMapper() {
    }

    public static ServiceResponse toResponse(ServiceOffering entity) {
        return new ServiceResponse(
                entity.getId(),
                entity.getSalonId(),
                entity.getName(),
                entity.getDescription(),
                entity.getPrice(),
                entity.getDurationMinutes(),
                entity.getImageUrl(),
                entity.getStatus().name(),
                entity.getCreatedAt()
        );
    }

    public static ServiceCatalogSummaryResponse toSummary(ServiceOffering entity) {
        return new ServiceCatalogSummaryResponse(
                entity.getId(),
                entity.getSalonId(),
                entity.getName(),
                entity.getPrice(),
                entity.getDurationMinutes(),
                entity.getStatus().name()
        );
    }
}
