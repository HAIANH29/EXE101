package be.exe.salon.dto.response;

public record StylistSummaryResponse(
        Long id,
        Long salonId,
        String status
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
