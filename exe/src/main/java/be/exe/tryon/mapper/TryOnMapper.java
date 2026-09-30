package be.exe.tryon.mapper;

import be.exe.tryon.client.AiTryOnClient;
import be.exe.tryon.domain.TryOnRequest;
import be.exe.tryon.domain.TryOnResult;
import be.exe.tryon.dto.TryOnFinalizeResponseDto;
import be.exe.tryon.dto.TryOnResponseDto;
import org.springframework.stereotype.Component;

@Component
public class TryOnMapper {

    public TryOnResponseDto toDto(TryOnRequest request, AiTryOnClient.AiOverlayResponse overlay) {
        return new TryOnResponseDto(
                request.getId(),
                request.getStatus(),
                overlay.hairstyleImageUrl(),
                overlay.x(),
                overlay.y(),
                overlay.width(),
                overlay.height()
        );
    }

    public TryOnFinalizeResponseDto toFinalizeDto(TryOnRequest request, TryOnResult result) {
        return new TryOnFinalizeResponseDto(
                request.getId(),
                request.getStatus(),
                result.getResultImageUrl()
        );
    }
}
