package be.exe.salon.dto.response;

import java.time.LocalTime;

public record BusinessHourResponse(
        Short dayOfWeek,
        LocalTime openTime,
        LocalTime closeTime,
        boolean closed
) {
}
