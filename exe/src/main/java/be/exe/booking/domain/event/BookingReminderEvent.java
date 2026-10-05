package be.exe.booking.domain.event;

import java.time.Instant;

public record BookingReminderEvent(
        Long bookingId,
        Long customerId,
        Instant startAt
) {}
