package be.exe.review.mapper;

import be.exe.review.domain.Review;
import be.exe.review.dto.response.ReviewResponse;

public final class ReviewMapper {

    private ReviewMapper() {
    }

    public static ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getBookingId(),
                review.getCustomerId(),
                review.getSalonId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
