package be.exe.review.dto.response;

public record SalonRatingSummaryResponse(
        Long salonId,
        Double averageRating,
        long totalReviews
) {
}
