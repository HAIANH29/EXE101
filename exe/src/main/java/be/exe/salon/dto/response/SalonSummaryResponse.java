package be.exe.salon.dto.response;

public record SalonSummaryResponse(
        Long id,
        Long ownerId,
        String name,
        String status
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }
}
