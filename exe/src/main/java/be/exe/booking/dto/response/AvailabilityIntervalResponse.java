package be.exe.booking.dto.response;

import java.time.Instant;

public record AvailabilityIntervalResponse(
        Instant startAt,
        Instant endAt
) {
}
