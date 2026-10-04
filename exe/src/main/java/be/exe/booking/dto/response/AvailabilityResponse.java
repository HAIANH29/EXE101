package be.exe.booking.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record AvailabilityResponse(
        Long salonId,
        Long stylistId,
        LocalDate date,
        boolean closed,
        LocalTime openTime,
        LocalTime closeTime,
        List<AvailabilityIntervalResponse> bookedIntervals
) {
}
