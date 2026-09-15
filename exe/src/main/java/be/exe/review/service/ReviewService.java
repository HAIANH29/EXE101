package be.exe.review.service;

import be.exe.review.dto.request.CreateReviewRequest;
import be.exe.review.dto.request.UpdateReviewRequest;
import be.exe.review.dto.response.ReviewResponse;
import be.exe.review.dto.response.SalonRatingSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    ReviewResponse createReview(Long customerId, CreateReviewRequest request);

    ReviewResponse updateReview(Long reviewId, Long customerId, UpdateReviewRequest request);

    ReviewResponse getReview(Long reviewId);

    Page<ReviewResponse> getReviewsBySalon(Long salonId, Pageable pageable);

    SalonRatingSummaryResponse getSalonRatingSummary(Long salonId);
}
