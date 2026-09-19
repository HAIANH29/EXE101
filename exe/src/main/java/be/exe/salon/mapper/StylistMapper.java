package be.exe.salon.mapper;

import be.exe.salon.domain.Stylist;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.dto.response.StylistSummaryResponse;
import be.exe.common.security.UserAccountPort;

public final class StylistMapper {

    private StylistMapper() {
    }

    public static StylistResponse toResponse(Stylist stylist) {
        return toResponse(stylist, null);
    }

    public static StylistResponse toResponse(
            Stylist stylist, UserAccountPort.PublicProfile profile) {
        return new StylistResponse(
                stylist.getId(),
                stylist.getUserId(),
                profile != null ? profile.fullName() : null,
                profile != null ? profile.avatarUrl() : null,
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
