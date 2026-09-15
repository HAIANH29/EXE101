package be.exe.review.dto.response;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long bookingId,
        Long customerId,
        Long salonId,
        Short rating,
        String comment,
        Instant createdAt
) {
}
