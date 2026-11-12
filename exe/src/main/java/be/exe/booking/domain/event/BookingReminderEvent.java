package be.exe.booking.domain.event;

import java.time.Instant;

/**
 * @param hoursBefore mốc nhắc: 5 (cùng ngày, ~5 tiếng trước) hoặc 1 (còn ~1 tiếng nữa)
 */
public record BookingReminderEvent(
        Long bookingId,
        Long customerId,
        Instant startAt,
        int hoursBefore
) {}
