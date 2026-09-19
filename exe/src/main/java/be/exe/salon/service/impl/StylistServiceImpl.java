package be.exe.salon.service.impl;

import be.exe.salon.domain.Salon;
import be.exe.salon.domain.Stylist;
import be.exe.salon.domain.StylistStatus;
import be.exe.salon.dto.request.CreateStylistRequest;
import be.exe.salon.dto.request.UpdateStylistRequest;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.dto.response.StylistSummaryResponse;
import be.exe.salon.mapper.StylistMapper;
import be.exe.salon.repository.SalonRepository;
import be.exe.salon.repository.StylistRepository;
import be.exe.salon.service.StylistService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.security.UserAccountPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StylistServiceImpl implements StylistService {

    private final StylistRepository stylistRepository;
    private final SalonRepository salonRepository;
    private final UserAccountPort userAccountPort;

    public StylistServiceImpl(StylistRepository stylistRepository,
                              SalonRepository salonRepository,
                              UserAccountPort userAccountPort) {
        this.stylistRepository = stylistRepository;
        this.salonRepository = salonRepository;
        this.userAccountPort = userAccountPort;
    }

    @Override
    @Transactional(readOnly = true)
    public StylistSummaryResponse getStylistOrThrow(Long stylistId) {
        Stylist stylist = findOrThrow(stylistId);
        return StylistMapper.toSummary(stylist);
    }

    @Override
    public StylistResponse createStylist(Long salonId, Long ownerId, CreateStylistRequest request) {
        Salon salon = salonRepository.findById(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon", salonId));

        if (!salon.isOwnedBy(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        if (stylistRepository.existsByUserId(request.getUserId())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "User này đã là stylist của 1 salon khác");
        }

        Stylist stylist = new Stylist(request.getUserId(), salonId);
        stylist.updateInfo(request.getBio(), request.getExperienceYears());
        stylistRepository.save(stylist);

        return toResponse(stylist);
    }

    @Override
    public StylistResponse updateStylist(Long stylistId, Long ownerId, UpdateStylistRequest request) {
        Stylist stylist = findOrThrow(stylistId);
        Salon salon = salonRepository.findById(stylist.getSalonId())
                .orElseThrow(() -> new ResourceNotFoundException("Salon", stylist.getSalonId()));

        if (!salon.isOwnedBy(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        stylist.updateInfo(request.getBio(), request.getExperienceYears());

        if (request.getStatus() != null) {
            stylist.changeStatus(StylistStatus.valueOf(request.getStatus()));
        }

        return toResponse(stylist);
    }

    @Override
    @Transactional(readOnly = true)
    public StylistResponse getStylist(Long stylistId) {
        return toResponse(findOrThrow(stylistId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StylistResponse> getStylistsBySalon(Long salonId, Pageable pageable) {
        return stylistRepository.findBySalonIdAndStatus(salonId, StylistStatus.ACTIVE, pageable)
                .map(this::toResponse);
    }

    private Stylist findOrThrow(Long stylistId) {
        return stylistRepository.findById(stylistId)
                .orElseThrow(() -> new ResourceNotFoundException("Stylist", stylistId));
    }

    private StylistResponse toResponse(Stylist stylist) {
        var profile = userAccountPort.findPublicProfileById(stylist.getUserId()).orElse(null);
        return StylistMapper.toResponse(stylist, profile);
    }
}
