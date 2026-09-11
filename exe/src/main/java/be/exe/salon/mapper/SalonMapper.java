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
        return new SalonResponse(
                salon.getId(),
                salon.getOwnerId(),
                salon.getName(),
                salon.getPhone(),
                salon.getAddress(),
                salon.getDescription(),
                salon.getImageUrl(),
                salon.getStatus().name(),
                salon.getCreatedAt()
        );
    }

    public static SalonDetailResponse toDetailResponse(Salon salon, List<SalonBusinessHour> hours) {
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
                salon.getStatus().name(),
                hourResponses,
                salon.getCreatedAt()
        );
    }

    public static SalonSummaryResponse toSummary(Salon salon) {
        return new SalonSummaryResponse(
                salon.getId(), salon.getOwnerId(), salon.getName(), salon.getStatus().name());
    }
}
