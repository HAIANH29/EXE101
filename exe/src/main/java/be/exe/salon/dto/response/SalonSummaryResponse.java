package be.exe.salon.dto.response;

public record SalonSummaryResponse(
        Long id,
        Long ownerId,
        String name,
        String status,
        boolean demo,
        boolean bookingEnabled
) {
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    public boolean isBookable() {
        return isActive() && bookingEnabled;
    }
}
