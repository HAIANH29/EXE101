package be.exe.catalog.service.impl;

import be.exe.catalog.domain.Gender;
import be.exe.catalog.domain.Hairstyle;
import be.exe.catalog.domain.HairstyleImage;
import be.exe.catalog.domain.HairstyleStatus;
import be.exe.catalog.domain.SalonHairstyle;
import be.exe.catalog.dto.request.CreateHairstyleRequest;
import be.exe.catalog.dto.request.UpdateHairstyleRequest;
import be.exe.catalog.dto.response.HairstyleImageUploadResponse;
import be.exe.catalog.dto.response.HairstyleResponse;
import be.exe.catalog.dto.response.HairstyleSummaryResponse;
import be.exe.catalog.mapper.HairstyleMapper;
import be.exe.catalog.repository.HairstyleImageRepository;
import be.exe.catalog.repository.HairstyleRepository;
import be.exe.catalog.repository.SalonHairstyleRepository;
import be.exe.catalog.service.HairstyleService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.storage.StorageService;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.service.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class HairstyleServiceImpl implements HairstyleService {

    /** Số ảnh tối đa cho 1 kiểu tóc (gồm cả ảnh bìa). */
    static final int MAX_IMAGES = 5;
    private static final long MAX_UPLOAD_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final String UPLOAD_FOLDER = "hairstyles";

    private final HairstyleRepository hairstyleRepository;
    private final HairstyleImageRepository hairstyleImageRepository;
    private final SalonHairstyleRepository salonHairstyleRepository;
    private final SalonService salonService;
    private final StorageService storageService;

    public HairstyleServiceImpl(HairstyleRepository hairstyleRepository,
                                 HairstyleImageRepository hairstyleImageRepository,
                                 SalonHairstyleRepository salonHairstyleRepository,
                                 SalonService salonService,
                                 StorageService storageService) {
        this.hairstyleRepository = hairstyleRepository;
        this.hairstyleImageRepository = hairstyleImageRepository;
        this.salonHairstyleRepository = salonHairstyleRepository;
        this.salonService = salonService;
        this.storageService = storageService;
    }

    @Override
    @Transactional(readOnly = true)
    public HairstyleSummaryResponse getHairstyleOrThrow(Long hairstyleId) {
        return HairstyleMapper.toSummary(findOrThrow(hairstyleId));
    }

    @Override
    public HairstyleResponse createHairstyle(CreateHairstyleRequest request) {
        List<String> images = resolveImages(request.getImageUrl(), request.getImageUrls());
        Hairstyle entity = new Hairstyle(request.getName(), images.get(0));
        entity.updateInfo(
                request.getName(), request.getDescription(), images.get(0),
                request.getCategoryId(),
                request.getGender() != null ? Gender.valueOf(request.getGender()) : null);

        hairstyleRepository.save(entity);
        replaceGallery(entity.getId(), images);
        return HairstyleMapper.toResponse(entity, images);
    }

    @Override
    public HairstyleResponse updateHairstyle(Long hairstyleId, UpdateHairstyleRequest request) {
        Hairstyle entity = findOrThrow(hairstyleId);
        List<String> images = resolveImages(request.getImageUrl(), request.getImageUrls());

        entity.updateInfo(
                request.getName(), request.getDescription(), images.get(0),
                request.getCategoryId(),
                request.getGender() != null ? Gender.valueOf(request.getGender()) : null);

        if (request.getStatus() != null) {
            entity.changeStatus(HairstyleStatus.valueOf(request.getStatus()));
        }

        replaceGallery(entity.getId(), images);
        return HairstyleMapper.toResponse(entity, images);
    }

    @Override
    @Transactional(readOnly = true)
    public HairstyleResponse getHairstyle(Long hairstyleId) {
        return toResponses(List.of(findOrThrow(hairstyleId))).get(0);
    }

    @Override
    public HairstyleImageUploadResponse uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn file ảnh");
        }
        if (file.getContentType() == null || !ALLOWED_IMAGE_TYPES.contains(file.getContentType().toLowerCase())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ảnh tối đa 5MB");
        }
        return new HairstyleImageUploadResponse(storageService.upload(file, UPLOAD_FOLDER));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HairstyleResponse> getHairstyles(Long categoryId, Pageable pageable) {
        Page<Hairstyle> page = (categoryId != null)
                ? hairstyleRepository.findByCategoryIdAndStatus(categoryId, HairstyleStatus.ACTIVE, pageable)
                : hairstyleRepository.findByStatus(HairstyleStatus.ACTIVE, pageable);
        List<HairstyleResponse> content = toResponses(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
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
        List<Hairstyle> active = salonHairstyleRepository.findBySalonId(salonId).stream()
                .map(link -> findOrThrow(link.getHairstyleId()))
                .filter(Hairstyle::isActive)
                .toList();
        return toResponses(active);
    }

    /** Gom ảnh của cả danh sách trong 1 query; kiểu tóc chưa có gallery thì trả [imageUrl]. */
    private List<HairstyleResponse> toResponses(List<Hairstyle> hairstyles) {
        if (hairstyles.isEmpty()) {
            return List.of();
        }
        List<Long> ids = hairstyles.stream().map(Hairstyle::getId).toList();
        Map<Long, List<String>> gallery = hairstyleImageRepository
                .findByHairstyleIdInOrderByHairstyleIdAscSortOrderAsc(ids).stream()
                .collect(Collectors.groupingBy(HairstyleImage::getHairstyleId,
                        Collectors.mapping(HairstyleImage::getImageUrl, Collectors.toList())));
        return hairstyles.stream()
                .map(h -> HairstyleMapper.toResponse(h, gallery.getOrDefault(h.getId(), List.of(h.getImageUrl()))))
                .toList();
    }

    /**
     * Danh sách ảnh cuối cùng: ưu tiên imageUrls (bỏ trống/trùng, tối đa MAX_IMAGES), nếu không có thì dùng imageUrl.
     * Phần tử đầu tiên là ảnh bìa.
     */
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
        if (cleaned.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ảnh minh họa không được để trống");
        }
        if (cleaned.size() > MAX_IMAGES) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Mỗi kiểu tóc tối đa " + MAX_IMAGES + " ảnh");
        }
        for (String url : cleaned) {
            String lower = url.toLowerCase();
            if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
                throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Link ảnh phải bắt đầu bằng http:// hoặc https://");
            }
        }
        return List.copyOf(cleaned);
    }

    private void replaceGallery(Long hairstyleId, List<String> images) {
        hairstyleImageRepository.deleteByHairstyleId(hairstyleId);
        for (int i = 0; i < images.size(); i++) {
            hairstyleImageRepository.save(new HairstyleImage(hairstyleId, images.get(i), i));
        }
    }

    private Hairstyle findOrThrow(Long hairstyleId) {
        return hairstyleRepository.findById(hairstyleId)
                .orElseThrow(() -> new ResourceNotFoundException("Hairstyle", hairstyleId));
    }
}
