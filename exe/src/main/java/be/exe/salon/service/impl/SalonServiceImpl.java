package be.exe.salon.service.impl;

import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonBusinessHour;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.request.CreateSalonRequest;
import be.exe.salon.dto.request.UpdateBusinessHourRequest;
import be.exe.salon.dto.request.UpdateSalonRequest;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.mapper.SalonMapper;
import be.exe.salon.repository.SalonBusinessHourRepository;
import be.exe.salon.repository.SalonRepository;
import be.exe.salon.service.SalonService;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SalonServiceImpl implements SalonService {

    private final SalonRepository salonRepository;
    private final SalonBusinessHourRepository businessHourRepository;

    public SalonServiceImpl(SalonRepository salonRepository,
                             SalonBusinessHourRepository businessHourRepository) {
        this.salonRepository = salonRepository;
        this.businessHourRepository = businessHourRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public SalonSummaryResponse getSalonOrThrow(Long salonId) {
        Salon salon = findOrThrow(salonId);
        return SalonMapper.toSummary(salon);
    }

    @Override
    public SalonResponse createSalon(Long ownerId, CreateSalonRequest request) {
        Salon salon = new Salon(ownerId, request.getName());
        salon.updateInfo(request.getName(), request.getPhone(), request.getAddress(),
                request.getDescription(), request.getImageUrl());
        // Salon mới tạo luôn ở trạng thái chờ duyệt, admin phải approve mới ACTIVE được
        salonRepository.save(salon);
        return SalonMapper.toResponse(salon);
    }

    @Override
    public SalonResponse updateSalon(Long salonId, Long ownerId, UpdateSalonRequest request) {
        Salon salon = findOrThrow(salonId);

        if (!salon.isOwnedBy(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        salon.updateInfo(request.getName(), request.getPhone(), request.getAddress(),
                request.getDescription(), request.getImageUrl());

        return SalonMapper.toResponse(salon);
    }

    @Override
    public SalonResponse updateSalonStatus(Long salonId, SalonStatus status) {
        Salon salon = findOrThrow(salonId);
        salon.changeStatus(status);
        return SalonMapper.toResponse(salon);
    }

    @Override
    @Transactional(readOnly = true)
    public SalonDetailResponse getSalonDetail(Long salonId) {
        Salon salon = findOrThrow(salonId);
        var hours = businessHourRepository.findBySalonIdOrderByDayOfWeek(salonId);
        return SalonMapper.toDetailResponse(salon, hours);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalonResponse> getSalons(SalonStatus statusFilter, Pageable pageable) {
        Page<Salon> page = (statusFilter != null)
                ? salonRepository.findByStatus(statusFilter, pageable)
                : salonRepository.findAll(pageable);
        return page.map(SalonMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalonResponse> getSalonsByOwner(Long ownerId, Pageable pageable) {
        return salonRepository.findByOwnerId(ownerId, pageable).map(SalonMapper::toResponse);
    }

    @Override
    public void updateBusinessHours(Long salonId, Long ownerId, List<UpdateBusinessHourRequest> requests) {
        Salon salon = findOrThrow(salonId);
        if (!salon.isOwnedBy(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        for (UpdateBusinessHourRequest req : requests) {
            SalonBusinessHour hour = businessHourRepository
                    .findBySalonIdAndDayOfWeek(salonId, req.getDayOfWeek())
                    .orElseGet(() -> new SalonBusinessHour(
                            salonId, req.getDayOfWeek(), req.getOpenTime(),
                            req.getCloseTime(), req.isClosed()));

            hour.update(req.getOpenTime(), req.getCloseTime(), req.isClosed());
            businessHourRepository.save(hour);
        }
    }

    private Salon findOrThrow(Long salonId) {
        return salonRepository.findById(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon", salonId));
    }
}
