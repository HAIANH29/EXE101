package be.exe.tryon.service;

import be.exe.catalog.dto.response.HairstyleSummaryResponse;
import be.exe.catalog.service.HairstyleService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.storage.StorageService;
import be.exe.tryon.client.AiTryOnClient;
import be.exe.tryon.domain.TryOnRequest;
import be.exe.tryon.domain.TryOnResult;
import be.exe.tryon.dto.TryOnFinalizeResponseDto;
import be.exe.tryon.dto.TryOnResponseDto;
import be.exe.tryon.dto.TryOnResultResponseDto;
import be.exe.tryon.mapper.TryOnMapper;
import be.exe.tryon.repository.TryOnRequestRepository;
import be.exe.tryon.repository.TryOnResultRepository;
import be.exe.tryon.validator.ImageFileValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class TryOnService {

    private final StorageService storageService;
    private final AiTryOnClient aiTryOnClient;
    private final TryOnRequestRepository requestRepository;
    private final TryOnResultRepository resultRepository;
    private final ImageFileValidator validator;
    private final TryOnMapper mapper;
    private final HairstyleService hairstyleService;

    public TryOnService(StorageService storageService,
                         AiTryOnClient aiTryOnClient,
                         TryOnRequestRepository requestRepository,
                         TryOnResultRepository resultRepository,
                         ImageFileValidator validator,
                         TryOnMapper mapper,
                         HairstyleService hairstyleService) {
        this.storageService = storageService;
        this.aiTryOnClient = aiTryOnClient;
        this.requestRepository = requestRepository;
        this.resultRepository = resultRepository;
        this.validator = validator;
        this.mapper = mapper;
        this.hairstyleService = hairstyleService;
    }

    /**
     * Bước 1: upload ảnh gốc + gọi AI tính vị trí overlay.
     * Chưa tạo TryOnResult — chỉ có TryOnRequest ở trạng thái READY_FOR_ADJUST.
     */
    @Transactional
    public TryOnResponseDto process(MultipartFile file, Long hairstyleId, Long userId) {
        validator.validate(file);

        HairstyleSummaryResponse hairstyle = hairstyleService.getHairstyleOrThrow(hairstyleId);
        if (!hairstyle.isActive() || hairstyle.imageUrl() == null || hairstyle.imageUrl().isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED,
                    "Kiểu tóc hiện không khả dụng");
        }

        String inputUrl = storageService.upload(file, "tryon/originals");

        TryOnRequest request = new TryOnRequest();
        request.setUserId(userId);
        request.setHairstyleId(hairstyleId);
        request.setInputImageUrl(inputUrl);
        request.setStatus("PENDING");
        request.setCreatedAt(OffsetDateTime.now());
        requestRepository.save(request);

        AiTryOnClient.AiOverlayResponse overlay = aiTryOnClient.computeOverlay(
            inputUrl, hairstyleId, hairstyle.imageUrl());

        request.setStatus("READY_FOR_ADJUST");
        requestRepository.save(request);

        return mapper.toDto(request, overlay);
    }

    /**
     * Bước 2: khách chỉnh xong (kéo/resize/xoay) bên FE, FE tự merge ảnh bằng
     * canvas rồi gửi file ảnh cuối lên đây để lưu.
     */
    @Transactional
    public TryOnFinalizeResponseDto finalize(Long requestId, MultipartFile resultImage, Long userId) {
        validator.validate(resultImage);

        TryOnRequest request = requestRepository.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("TryOnRequest", requestId));

        if (!"READY_FOR_ADJUST".equals(request.getStatus())) {
            throw new BusinessException(ErrorCode.TRYON_REQUEST_NOT_READY);
        }

        if (resultRepository.existsByRequestId(requestId)) {
            throw new BusinessException(ErrorCode.TRYON_RESULT_ALREADY_EXISTS);
        }

        String resultUrl = storageService.upload(resultImage, "tryon/results");

        TryOnResult result = new TryOnResult();
        result.setRequestId(request.getId());
        result.setResultImageUrl(resultUrl);
        result.setCreatedAt(OffsetDateTime.now());
        resultRepository.save(result);

        request.setStatus("DONE");
        request.setCompletedAt(OffsetDateTime.now());
        requestRepository.save(request);

        return mapper.toFinalizeDto(request, result);
    }

    @Transactional(readOnly = true)
    public TryOnResultResponseDto getResult(Long requestId, Long userId) {
        TryOnRequest request = requestRepository.findByIdAndUserId(requestId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("TryOnRequest", requestId));
        TryOnResult result = resultRepository.findByRequestId(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.TRYON_RESULT_NOT_FOUND));
        return toResultDto(request, result);
    }

    @Transactional(readOnly = true)
    public Page<TryOnResultResponseDto> getResults(Long userId, Pageable pageable) {
        Page<TryOnRequest> requests = requestRepository.findByUserIdAndStatus(userId, "DONE", pageable);
        List<Long> requestIds = requests.getContent().stream()
            .map(request -> Objects.requireNonNull(request.getId()))
            .toList();
        Map<Long, TryOnResult> results = new HashMap<>();
        resultRepository.findByRequestIdIn(requestIds)
                .forEach(result -> results.put(result.getRequestId(), result));
        return requests.map(request -> {
            return toResultDto(request, Objects.requireNonNull(results.get(request.getId())));
        });
    }

    private TryOnResultResponseDto toResultDto(TryOnRequest request, TryOnResult result) {
        return new TryOnResultResponseDto(
                request.getId(), request.getStatus(), result.getResultImageUrl(), result.getCreatedAt());
    }
}
