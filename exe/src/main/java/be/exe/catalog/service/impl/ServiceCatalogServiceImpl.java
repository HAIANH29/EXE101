package be.exe.catalog.service.impl;

import be.exe.catalog.domain.ServiceOffering;
import be.exe.catalog.domain.ServiceStatus;
import be.exe.catalog.dto.request.CreateServiceRequest;
import be.exe.catalog.dto.request.UpdateServiceRequest;
import be.exe.catalog.dto.response.ServiceCatalogSummaryResponse;
import be.exe.catalog.dto.response.ServiceResponse;
import be.exe.catalog.mapper.ServiceOfferingMapper;
import be.exe.catalog.repository.ServiceOfferingRepository;
import be.exe.catalog.service.ServiceCatalogService;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.service.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Đây là ví dụ cụ thể cho nguyên tắc "module A chỉ gọi module B qua Service public method":
 * ServiceCatalogServiceImpl gọi salon.service.SalonService (interface) để kiểm tra quyền sở hữu
 * salon, KHÔNG import SalonRepository hay Salon entity của module salon.
 */
@Service
@Transactional
public class ServiceCatalogServiceImpl implements ServiceCatalogService {

    private final ServiceOfferingRepository serviceOfferingRepository;
    private final SalonService salonService;

    public ServiceCatalogServiceImpl(ServiceOfferingRepository serviceOfferingRepository,
                                      SalonService salonService) {
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.salonService = salonService;
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceCatalogSummaryResponse getServiceOrThrow(Long serviceId) {
        return ServiceOfferingMapper.toSummary(findOrThrow(serviceId));
    }

    @Override
    public ServiceResponse createService(Long salonId, Long ownerId, CreateServiceRequest request) {
        SalonSummaryResponse salon = salonService.getSalonOrThrow(salonId);
        if (!salon.ownerId().equals(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        ServiceOffering entity = new ServiceOffering(
                salonId, request.getName(), request.getPrice(), request.getDurationMinutes());
        entity.updateInfo(request.getName(), request.getDescription(),
                request.getPrice(), request.getDurationMinutes());

        serviceOfferingRepository.save(entity);
        return ServiceOfferingMapper.toResponse(entity);
    }

    @Override
    public ServiceResponse updateService(Long serviceId, Long ownerId, UpdateServiceRequest request) {
        ServiceOffering entity = findOrThrow(serviceId);

        SalonSummaryResponse salon = salonService.getSalonOrThrow(entity.getSalonId());
        if (!salon.ownerId().equals(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        entity.updateInfo(request.getName(), request.getDescription(),
                request.getPrice(), request.getDurationMinutes());

        if (request.getStatus() != null) {
            entity.changeStatus(ServiceStatus.valueOf(request.getStatus()));
        }

        return ServiceOfferingMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceResponse getService(Long serviceId) {
        return ServiceOfferingMapper.toResponse(findOrThrow(serviceId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceResponse> getServicesBySalon(Long salonId, Pageable pageable) {
        return serviceOfferingRepository.findBySalonIdAndStatus(salonId, ServiceStatus.ACTIVE, pageable)
                .map(ServiceOfferingMapper::toResponse);
    }

    private ServiceOffering findOrThrow(Long serviceId) {
        return serviceOfferingRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service", serviceId));
    }
}
