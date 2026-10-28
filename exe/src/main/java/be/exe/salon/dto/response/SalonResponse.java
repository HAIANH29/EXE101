package be.exe.salon.dto.response;

import java.time.Instant;
import java.util.List;

public record SalonResponse(
        Long id,
        Long ownerId,
        String name,
        String phone,
        String address,
        String description,
        String imageUrl,
        List<String> imageUrls,
        String status,
        Instant createdAt
) {
    public SalonResponse(
            Long id,
            Long ownerId,
            String name,
            String phone,
            String address,
            String description,
            String imageUrl,
            String status,
            Instant createdAt
    ) {
        this(id, ownerId, name, phone, address, description, imageUrl,
                imageUrl != null && !imageUrl.isBlank() ? List.of(imageUrl) : List.of(),
                status, createdAt);
    }
}
