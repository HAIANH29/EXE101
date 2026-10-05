package be.exe.review.controller;

import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.security.CustomUserDetails;
import be.exe.common.util.PaginationUtils;
import be.exe.review.dto.request.CreateReviewRequest;
import be.exe.review.dto.request.UpdateReviewRequest;
import be.exe.review.dto.response.ReviewResponse;
import be.exe.review.dto.response.SalonRatingSummaryResponse;
import be.exe.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/api/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse response = reviewService.createReview(principal.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Đánh giá thành công", response));
    }

    @PutMapping("/api/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewRequest request) {
        ReviewResponse response = reviewService.updateReview(reviewId, principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getReview(reviewId)));
    }

    @GetMapping("/api/salons/{salonId}/reviews")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getReviewsBySalon(
            @PathVariable Long salonId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size, "createdAt", "DESC");
        var result = reviewService.getReviewsBySalon(salonId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/api/salons/{salonId}/reviews/summary")
    public ResponseEntity<ApiResponse<SalonRatingSummaryResponse>> getSalonRatingSummary(
            @PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getSalonRatingSummary(salonId)));
    }
}
