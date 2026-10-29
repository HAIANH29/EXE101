package be.exe.salon.mapper;

import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonBusinessHour;
import be.exe.salon.dto.response.BusinessHourResponse;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.dto.response.SalonSummaryResponse;

import java.util.List;

public final class SalonMapper {

    private SalonMapper() {
    }

    public static SalonResponse toResponse(Salon salon) {
        return toResponse(salon, salon.getImageUrl() != null && !salon.getImageUrl().isBlank()
                ? List.of(salon.getImageUrl())
                : List.of());
    }

    public static SalonResponse toResponse(Salon salon, List<String> imageUrls) {
        return new SalonResponse(
                salon.getId(),
                salon.getOwnerId(),
                salon.getName(),
                salon.getPhone(),
                salon.getAddress(),
                salon.getDescription(),
                salon.getImageUrl(),
                imageUrls != null ? imageUrls : List.of(),
                salon.getGeoapifyPlaceId(),
                salon.getLatitude(),
                salon.getLongitude(),
                salon.isDemo(),
                salon.getStatus().name(),
                salon.getCreatedAt()
        );
    }

    public static SalonDetailResponse toDetailResponse(Salon salon, List<SalonBusinessHour> hours) {
        return toDetailResponse(salon, hours, salon.getImageUrl() != null && !salon.getImageUrl().isBlank()
                ? List.of(salon.getImageUrl())
                : List.of());
    }

    public static SalonDetailResponse toDetailResponse(Salon salon, List<SalonBusinessHour> hours, List<String> imageUrls) {
        List<BusinessHourResponse> hourResponses = hours.stream()
                .map(h -> new BusinessHourResponse(
                        h.getDayOfWeek(), h.getOpenTime(), h.getCloseTime(), h.isClosed()))
                .toList();

        return new SalonDetailResponse(
                salon.getId(),
                salon.getOwnerId(),
                salon.getName(),
                salon.getPhone(),
                salon.getAddress(),
                salon.getDescription(),
                salon.getImageUrl(),
                imageUrls != null ? imageUrls : List.of(),
                salon.getGeoapifyPlaceId(),
                salon.getLatitude(),
                salon.getLongitude(),
                salon.isDemo(),
                salon.getStatus().name(),
                hourResponses,
                salon.getCreatedAt()
        );
    }

    public static SalonSummaryResponse toSummary(Salon salon) {
        return new SalonSummaryResponse(
                salon.getId(), salon.getOwnerId(), salon.getName(), salon.getStatus().name(), salon.isDemo());
    }
}
