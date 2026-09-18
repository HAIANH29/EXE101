package be.exe.reporting.dto.response;

public record BookingStatisticsResponse(
        long pending,
        long confirmed,
        long completed,
        long cancelled,
        long total
) {
}
