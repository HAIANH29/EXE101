package be.exe.tryon.service;

import be.exe.common.storage.StorageService;
import be.exe.tryon.client.AiTryOnClient;
import be.exe.tryon.domain.TryOnRequest;
import be.exe.tryon.domain.TryOnResult;
import be.exe.tryon.dto.TryOnResponseDto;
import be.exe.tryon.mapper.TryOnMapper;
import be.exe.tryon.repository.TryOnRequestRepository;
import be.exe.tryon.repository.TryOnResultRepository;
import be.exe.tryon.validator.ImageFileValidator;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;

@Service
public class TryOnService {

    private final StorageService storageService;
    private final AiTryOnClient aiTryOnClient;
    private final TryOnRequestRepository requestRepository;
    private final TryOnResultRepository resultRepository;
    private final ImageFileValidator validator;
    private final TryOnMapper mapper;

    public TryOnService(StorageService storageService,
                         AiTryOnClient aiTryOnClient,
                         TryOnRequestRepository requestRepository,
                         TryOnResultRepository resultRepository,
                         ImageFileValidator validator,
                         TryOnMapper mapper) {
        this.storageService = storageService;
        this.aiTryOnClient = aiTryOnClient;
        this.requestRepository = requestRepository;
        this.resultRepository = resultRepository;
        this.validator = validator;
        this.mapper = mapper;
    }

    public TryOnResponseDto process(MultipartFile file, Long hairstyleId, Long userId) {
        validator.validate(file);

        String inputUrl = storageService.upload(file, "tryon/originals");

        TryOnRequest request = new TryOnRequest();
        request.setUserId(userId);
        request.setHairstyleId(hairstyleId);
        request.setInputImageUrl(inputUrl);
        request.setStatus("PENDING");
        request.setCreatedAt(OffsetDateTime.now());
        requestRepository.save(request);

        String resultUrl = aiTryOnClient.process(inputUrl, hairstyleId);

        TryOnResult result = new TryOnResult();
        result.setRequestId(request.getId());
        result.setResultImageUrl(resultUrl);
        result.setCreatedAt(OffsetDateTime.now());
        resultRepository.save(result);

        request.setStatus("DONE");
        request.setCompletedAt(OffsetDateTime.now());
        requestRepository.save(request);

        return mapper.toDto(request, resultUrl);
    }
}
