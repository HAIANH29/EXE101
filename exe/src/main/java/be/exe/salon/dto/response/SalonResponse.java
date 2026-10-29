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
        String geoapifyPlaceId,
        Double latitude,
        Double longitude,
        boolean demo,
        String listingSource,
        String sourceProvider,
        String sourceUrl,
        String sourcePlaceId,
        Instant locationVerifiedAt,
        boolean bookingEnabled,
        boolean platformManaged,
        boolean businessHoursVerified,
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
                null, null, null, false, "OWNER_SUBMITTED", "OWNER", null, null,
                null, false, false, false, status, createdAt);
    }
}
