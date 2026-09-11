package be.exe.catalog.service.impl;

import be.exe.catalog.domain.Gender;
import be.exe.catalog.domain.Hairstyle;
import be.exe.catalog.domain.HairstyleStatus;
import be.exe.catalog.domain.SalonHairstyle;
import be.exe.catalog.dto.request.CreateHairstyleRequest;
import be.exe.catalog.dto.request.UpdateHairstyleRequest;
import be.exe.catalog.dto.response.HairstyleResponse;
import be.exe.catalog.dto.response.HairstyleSummaryResponse;
import be.exe.catalog.mapper.HairstyleMapper;
import be.exe.catalog.repository.HairstyleRepository;
import be.exe.catalog.repository.SalonHairstyleRepository;
import be.exe.catalog.service.HairstyleService;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.service.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class HairstyleServiceImpl implements HairstyleService {

    private final HairstyleRepository hairstyleRepository;
    private final SalonHairstyleRepository salonHairstyleRepository;
    private final SalonService salonService;

    public HairstyleServiceImpl(HairstyleRepository hairstyleRepository,
                                 SalonHairstyleRepository salonHairstyleRepository,
                                 SalonService salonService) {
        this.hairstyleRepository = hairstyleRepository;
        this.salonHairstyleRepository = salonHairstyleRepository;
        this.salonService = salonService;
    }

    @Override
    @Transactional(readOnly = true)
    public HairstyleSummaryResponse getHairstyleOrThrow(Long hairstyleId) {
        return HairstyleMapper.toSummary(findOrThrow(hairstyleId));
    }

    @Override
    public HairstyleResponse createHairstyle(CreateHairstyleRequest request) {
        Hairstyle entity = new Hairstyle(request.getName(), request.getImageUrl());
        entity.updateInfo(
                request.getName(), request.getDescription(), request.getImageUrl(),
                request.getCategoryId(),
                request.getGender() != null ? Gender.valueOf(request.getGender()) : null);

        hairstyleRepository.save(entity);
        return HairstyleMapper.toResponse(entity);
    }

    @Override
    public HairstyleResponse updateHairstyle(Long hairstyleId, UpdateHairstyleRequest request) {
        Hairstyle entity = findOrThrow(hairstyleId);

        entity.updateInfo(
                request.getName(), request.getDescription(), request.getImageUrl(),
                request.getCategoryId(),
                request.getGender() != null ? Gender.valueOf(request.getGender()) : null);

        if (request.getStatus() != null) {
            entity.changeStatus(HairstyleStatus.valueOf(request.getStatus()));
        }

        return HairstyleMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public HairstyleResponse getHairstyle(Long hairstyleId) {
        return HairstyleMapper.toResponse(findOrThrow(hairstyleId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HairstyleResponse> getHairstyles(Long categoryId, Pageable pageable) {
        Page<Hairstyle> page = (categoryId != null)
                ? hairstyleRepository.findByCategoryId(categoryId, pageable)
                : hairstyleRepository.findAll(pageable);
        return page.map(HairstyleMapper::toResponse);
    }

    @Override
    public void assignToSalon(Long salonId, Long hairstyleId, Long ownerId) {
        SalonSummaryResponse salon = salonService.getSalonOrThrow(salonId);
        if (!salon.ownerId().equals(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        // Đảm bảo hairstyle tồn tại trước khi gán
        findOrThrow(hairstyleId);

        if (!salonHairstyleRepository.existsBySalonIdAndHairstyleId(salonId, hairstyleId)) {
            salonHairstyleRepository.save(new SalonHairstyle(salonId, hairstyleId));
        }
    }

    @Override
    public void unassignFromSalon(Long salonId, Long hairstyleId, Long ownerId) {
        SalonSummaryResponse salon = salonService.getSalonOrThrow(salonId);
        if (!salon.ownerId().equals(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        salonHairstyleRepository.deleteBySalonIdAndHairstyleId(salonId, hairstyleId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HairstyleResponse> getHairstylesBySalon(Long salonId) {
        return salonHairstyleRepository.findBySalonId(salonId).stream()
                .map(link -> findOrThrow(link.getHairstyleId()))
                .map(HairstyleMapper::toResponse)
                .toList();
    }

    private Hairstyle findOrThrow(Long hairstyleId) {
        return hairstyleRepository.findById(hairstyleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hairstyle", hairstyleId));
    }
}
