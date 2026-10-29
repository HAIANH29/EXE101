package be.exe.salon.service.impl;

import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonBusinessHour;
import be.exe.salon.domain.SalonImage;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.request.CreateSalonRequest;
import be.exe.salon.dto.request.UpdateBusinessHourRequest;
import be.exe.salon.dto.request.UpdateSalonRequest;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonImageUploadResponse;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.dto.response.BusinessHourResponse;
import be.exe.salon.mapper.SalonMapper;
import be.exe.salon.repository.SalonBusinessHourRepository;
import be.exe.salon.repository.SalonImageRepository;
import be.exe.salon.repository.SalonRepository;
import be.exe.salon.repository.StylistRepository;
import be.exe.salon.service.SalonService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.storage.StorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.DayOfWeek;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class SalonServiceImpl implements SalonService {

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
    private static final String UPLOAD_FOLDER = "salons";
    private static final int MAX_IMAGES = 10;

    private final SalonRepository salonRepository;
    private final SalonBusinessHourRepository businessHourRepository;
    private final StylistRepository stylistRepository;
    private final SalonImageRepository salonImageRepository;
    private final StorageService storageService;

    public SalonServiceImpl(SalonRepository salonRepository,
                            SalonBusinessHourRepository businessHourRepository,
                            StylistRepository stylistRepository,
                            SalonImageRepository salonImageRepository,
                            StorageService storageService) {
        this.salonRepository = salonRepository;
        this.businessHourRepository = businessHourRepository;
        this.stylistRepository = stylistRepository;
        this.salonImageRepository = salonImageRepository;
        this.storageService = storageService;
    }

    @Override
    @Transactional(readOnly = true)
    public SalonSummaryResponse getSalonOrThrow(Long salonId) {
        Salon salon = findOrThrow(salonId);
        return SalonMapper.toSummary(salon);
    }

    @Override
    public SalonImageUploadResponse uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn file ảnh");
        }
        if (file.getContentType() == null || !ALLOWED_IMAGE_TYPES.contains(file.getContentType().toLowerCase())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ảnh tối đa 5MB");
        }
        return new SalonImageUploadResponse(storageService.upload(file, UPLOAD_FOLDER));
    }

    @Override
    public SalonResponse createSalon(Long ownerId, CreateSalonRequest request) {
        if (salonRepository.existsByOwnerIdAndStatus(ownerId, SalonStatus.PENDING_APPROVAL)) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Bạn đang có một yêu cầu tạo salon chờ duyệt. Vui lòng chờ quản trị viên xử lý trước khi tạo yêu cầu mới."
            );
        }

        List<String> images = resolveImages(request.getImageUrl(), request.getImageUrls());
        String coverImage = images.isEmpty() ? null : images.get(0);

        Salon salon = new Salon(ownerId, request.getName());
        salon.updateInfo(request.getName(), request.getPhone(), request.getAddress(),
                request.getDescription(), coverImage);
        linkGeoapifyLocation(salon, request.getGeoapifyPlaceId(),
                request.getLatitude(), request.getLongitude(), null);
        // Salon mới tạo luôn ở trạng thái chờ duyệt, admin phải approve mới ACTIVE được
        salon = salonRepository.saveAndFlush(salon);

        if (!images.isEmpty()) {
            replaceGallery(salon.getId(), images);
        }

        return SalonMapper.toResponse(salon, images);
    }

    @Override
    public SalonResponse updateSalon(Long salonId, Long ownerId, UpdateSalonRequest request) {
        Salon salon = findOrThrow(salonId);

        if (!salon.isOwnedBy(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }

        List<String> images = resolveImages(request.getImageUrl(), request.getImageUrls());
        String coverImage = images.isEmpty() ? null : images.get(0);

        salon.updateInfo(request.getName(), request.getPhone(), request.getAddress(),
                request.getDescription(), coverImage);
        if (hasGeoapifyLocation(request.getGeoapifyPlaceId(), request.getLatitude(), request.getLongitude())) {
            String requestedPlaceId = request.getGeoapifyPlaceId() == null
                    ? null : request.getGeoapifyPlaceId().trim();
            boolean locationChanged = !java.util.Objects.equals(requestedPlaceId, salon.getGeoapifyPlaceId())
                    || !java.util.Objects.equals(request.getLatitude(), salon.getLatitude())
                    || !java.util.Objects.equals(request.getLongitude(), salon.getLongitude());
            linkGeoapifyLocation(salon, request.getGeoapifyPlaceId(),
                    request.getLatitude(), request.getLongitude(), salonId);
            if (locationChanged) {
                salon.changeStatus(SalonStatus.PENDING_APPROVAL);
            }
        }

        replaceGallery(salon.getId(), images);

        return SalonMapper.toResponse(salon, images);
    }

    @Override
    public SalonResponse updateSalonStatus(Long salonId, SalonStatus status) {
        if (status == SalonStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Không thể kích hoạt salon qua API đổi trạng thái; hãy dùng quy trình phê duyệt salon");
        }
        Salon salon = findOrThrow(salonId);
        salon.changeStatus(status);
        List<String> images = getImagesForSalon(salonId, salon.getImageUrl());
        return SalonMapper.toResponse(salon, images);
    }

    @Override
    public SalonResponse approveSalon(Long salonId) {
        Salon salon = salonRepository.findByIdForUpdate(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon", salonId));

        if (salon.getStatus() != SalonStatus.PENDING_APPROVAL) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Chỉ có thể phê duyệt salon đang ở trạng thái chờ duyệt (PENDING_APPROVAL). Trạng thái hiện tại: " + salon.getStatus()
            );
        }

        validateSalonReadyForBooking(salon);

        salon.changeStatus(SalonStatus.ACTIVE);
        List<String> images = getImagesForSalon(salonId, salon.getImageUrl());
        return SalonMapper.toResponse(salon, images);
    }

    @Override
    public SalonResponse rejectSalon(Long salonId) {
        Salon salon = salonRepository.findByIdForUpdate(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon", salonId));

        if (salon.getStatus() != SalonStatus.PENDING_APPROVAL) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Chỉ có thể từ chối salon đang ở trạng thái chờ duyệt (PENDING_APPROVAL). Trạng thái hiện tại: " + salon.getStatus()
            );
        }

        salon.changeStatus(SalonStatus.INACTIVE);
        List<String> images = getImagesForSalon(salonId, salon.getImageUrl());
        return SalonMapper.toResponse(salon, images);
    }

    @Override
    @Transactional(readOnly = true)
    public SalonDetailResponse getSalonDetail(Long salonId) {
        Salon salon = findOrThrow(salonId);
        var hours = businessHourRepository.findBySalonIdOrderByDayOfWeek(salonId);
        List<String> images = getImagesForSalon(salonId, salon.getImageUrl());
        return SalonMapper.toDetailResponse(salon, hours, images);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalonResponse> getSalons(SalonStatus statusFilter, Pageable pageable) {
        Page<Salon> page = (statusFilter != null)
                ? salonRepository.findByStatus(statusFilter, pageable)
                : salonRepository.findAll(pageable);
        List<SalonResponse> content = toResponses(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SalonResponse> getSalonsByOwner(Long ownerId, Pageable pageable) {
        Page<Salon> page = salonRepository.findByOwnerId(ownerId, pageable);
        List<SalonResponse> content = toResponses(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
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
        salon.markBusinessHoursVerified();
    }

    @Override
    @Transactional(readOnly = true)
    public BusinessHourResponse getBusinessHour(Long salonId, DayOfWeek dayOfWeek) {
        findOrThrow(salonId);
        Short day = (short) dayOfWeek.getValue();
        return businessHourRepository.findBySalonIdAndDayOfWeek(salonId, day)
                .map(hour -> new BusinessHourResponse(
                        hour.getDayOfWeek(), hour.getOpenTime(), hour.getCloseTime(), hour.isClosed()))
                .orElseGet(() -> new BusinessHourResponse(day, null, null, true));
    }

    @Override
    @Transactional(readOnly = true)
    public long countSalonsByStatus(SalonStatus status) {
        return salonRepository.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAllSalons() {
        return salonRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyOwner(Long salonId, Long ownerId) {
        Salon salon = findOrThrow(salonId);
        if (!salon.isOwnedBy(ownerId)) {
            throw new ForbiddenException("Bạn không phải chủ sở hữu salon này");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveStylists(Long salonId) {
        return stylistRepository.countBySalonIdAndStatus(
                salonId, be.exe.salon.domain.StylistStatus.ACTIVE);
    }

    @Override
    public SalonResponse updateSalonByAdmin(Long salonId, UpdateSalonRequest request) {
        Salon salon = findOrThrow(salonId);

        List<String> images = resolveImages(request.getImageUrl(), request.getImageUrls());
        String coverImage = images.isEmpty() ? null : images.get(0);

        salon.updateInfo(request.getName(), request.getPhone(), request.getAddress(),
                request.getDescription(), coverImage);
        if (hasGeoapifyLocation(request.getGeoapifyPlaceId(), request.getLatitude(), request.getLongitude())) {
            linkGeoapifyLocation(salon, request.getGeoapifyPlaceId(),
                    request.getLatitude(), request.getLongitude(), salonId);
        }

        replaceGallery(salon.getId(), images);

        return SalonMapper.toResponse(salon, images);
    }

    @Override
    public void deleteSalonByAdmin(Long salonId) {
        Salon salon = findOrThrow(salonId);
        salon.changeStatus(SalonStatus.INACTIVE);
    }

    private List<String> getImagesForSalon(Long salonId, String fallbackCover) {
        List<String> images = salonImageRepository.findBySalonIdOrderBySortOrderAsc(salonId).stream()
                .map(SalonImage::getImageUrl)
                .toList();
        if (images.isEmpty() && fallbackCover != null && !fallbackCover.isBlank()) {
            return List.of(fallbackCover);
        }
        return images;
    }

    private List<SalonResponse> toResponses(List<Salon> salons) {
        if (salons.isEmpty()) {
            return List.of();
        }
        List<Long> ids = salons.stream().map(Salon::getId).toList();
        Map<Long, List<String>> gallery = salonImageRepository
                .findBySalonIdInOrderBySalonIdAscSortOrderAsc(ids).stream()
                .collect(Collectors.groupingBy(SalonImage::getSalonId,
                        Collectors.mapping(SalonImage::getImageUrl, Collectors.toList())));
        return salons.stream()
                .map(s -> SalonMapper.toResponse(s, gallery.getOrDefault(s.getId(),
                        s.getImageUrl() != null && !s.getImageUrl().isBlank()
                                ? List.of(s.getImageUrl())
                                : List.of())))
                .toList();
    }

    private List<String> resolveImages(String imageUrl, List<String> imageUrls) {
        Set<String> cleaned = new LinkedHashSet<>();
        if (imageUrls != null) {
            for (String url : imageUrls) {
                if (url != null && !url.isBlank()) {
                    cleaned.add(url.trim());
                }
            }
        }
        if (cleaned.isEmpty() && imageUrl != null && !imageUrl.isBlank()) {
            cleaned.add(imageUrl.trim());
        }
        if (cleaned.size() > MAX_IMAGES) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mỗi salon tối đa " + MAX_IMAGES + " ảnh");
        }
        for (String url : cleaned) {
            String lower = url.toLowerCase();
            if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Link ảnh phải bắt đầu bằng http:// hoặc https://");
            }
        }
        return List.copyOf(cleaned);
    }

    private void replaceGallery(Long salonId, List<String> images) {
        salonImageRepository.deleteBySalonId(salonId);
        for (int i = 0; i < images.size(); i++) {
            salonImageRepository.save(new SalonImage(salonId, images.get(i), i));
        }
    }

    private boolean hasGeoapifyLocation(String placeId, Double latitude, Double longitude) {
        return (placeId != null && !placeId.isBlank()) || latitude != null || longitude != null;
    }

    private void linkGeoapifyLocation(Salon salon, String placeId, Double latitude,
                                      Double longitude, Long currentSalonId) {
        if (!hasGeoapifyLocation(placeId, latitude, longitude)) {
            return;
        }
        if (placeId == null || placeId.isBlank() || latitude == null || longitude == null
                || !Double.isFinite(latitude) || latitude < -90 || latitude > 90
                || !Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Liên kết Geoapify phải có placeId và tọa độ hợp lệ");
        }
        String normalizedPlaceId = placeId.trim();
        boolean alreadyLinked = currentSalonId == null
                ? salonRepository.existsByGeoapifyPlaceId(normalizedPlaceId)
                : salonRepository.existsByGeoapifyPlaceIdAndIdNot(normalizedPlaceId, currentSalonId);
        if (alreadyLinked) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Salon Geoapify này đã được liên kết với một tài khoản StyleLock khác");
        }
        salon.linkGeoapifyLocation(normalizedPlaceId, latitude, longitude);
    }

    private Salon findOrThrow(Long salonId) {
        return salonRepository.findById(salonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salon", salonId));
    }

    private void validateSalonReadyForBooking(Salon salon) {
        boolean hasGeoapifyLocation = salon.getGeoapifyPlaceId() != null
                && !salon.getGeoapifyPlaceId().isBlank()
                && salon.getLocationVerifiedAt() != null
                && salon.getLatitude() != null && salon.getLongitude() != null;
        boolean hasVerifiedCuratedLocation = salon.isPlatformManaged()
                && salon.getSourcePlaceId() != null && !salon.getSourcePlaceId().isBlank()
                && salon.getLocationVerifiedAt() != null
                && salon.getLatitude() != null && salon.getLongitude() != null;
        if (!hasGeoapifyLocation && !hasVerifiedCuratedLocation) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Salon phải có địa điểm Geoapify hoặc nguồn khảo sát đã xác minh trước khi được phê duyệt");
        }
        if (stylistRepository.countBySalonIdAndStatus(
                salon.getId(), be.exe.salon.domain.StylistStatus.ACTIVE) < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Salon phải có ít nhất một stylist đang hoạt động trước khi được phê duyệt");
        }
        List<SalonBusinessHour> hours = businessHourRepository
                .findBySalonIdOrderByDayOfWeek(salon.getId());
        boolean hasSevenDays = hours.size() == 7;
        boolean hasOpenDay = hours.stream().anyMatch(hour -> !hour.isClosed()
                && hour.getOpenTime() != null && hour.getCloseTime() != null);
        if (!hasSevenDays || !hasOpenDay) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Salon phải khai báo đủ 7 ngày và có ít nhất một ngày mở cửa trước khi được phê duyệt");
        }
    }
}
