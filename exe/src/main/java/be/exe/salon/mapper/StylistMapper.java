package be.exe.salon.mapper;

import be.exe.salon.domain.Stylist;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.dto.response.StylistSummaryResponse;

public final class StylistMapper {

    private StylistMapper() {
    }

    public static StylistResponse toResponse(Stylist stylist) {
        return new StylistResponse(
                stylist.getId(),
                stylist.getUserId(),
                stylist.getSalonId(),
                stylist.getBio(),
                stylist.getExperienceYears(),
                stylist.getStatus().name(),
                stylist.getCreatedAt()
        );
    }

    public static StylistSummaryResponse toSummary(Stylist stylist) {
        return new StylistSummaryResponse(
                stylist.getId(), stylist.getSalonId(), stylist.getStatus().name());
    }
}
