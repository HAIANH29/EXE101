package be.exe.publicapi.dto;

public record ExternalSalonResponse(
        String placeId,
        String name,
        String address,
        String phone,
        Double latitude,
        Double longitude,
        Integer distanceMeters,
        String mapUrl,
        String openingHours,
        String website
) {
}
