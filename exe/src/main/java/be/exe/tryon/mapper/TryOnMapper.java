package be.exe.tryon.mapper;

import be.exe.tryon.domain.TryOnRequest;
import be.exe.tryon.dto.TryOnResponseDto;
import org.springframework.stereotype.Component;

@Component
public class TryOnMapper {

    public TryOnResponseDto toDto(TryOnRequest request, String resultImageUrl) {
        return new TryOnResponseDto(
                request.getId(),
                request.getStatus(),
                resultImageUrl
        );
    }
}
