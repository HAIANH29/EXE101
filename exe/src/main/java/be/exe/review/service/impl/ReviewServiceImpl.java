package be.exe.review.service.impl;

import be.exe.booking.dto.response.BookingSummaryResponse;
import be.exe.booking.service.BookingService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ForbiddenException;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.exception.ValidationException;
import be.exe.review.domain.Review;
import be.exe.review.dto.request.CreateReviewRequest;
import be.exe.review.dto.request.UpdateReviewRequest;
import be.exe.review.dto.response.ReviewResponse;
import be.exe.review.dto.response.SalonRatingSummaryResponse;
import be.exe.review.mapper.ReviewMapper;
import be.exe.review.repository.ReviewRepository;
import be.exe.review.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gọi sang booking module qua BookingService.getBookingOrThrow() để kiểm tra:
 * - booking có thuộc đúng customer đang review không
 * - booking đã COMPLETED chưa (chỉ cho review sau khi hoàn tất lịch hẹn)
 * KHÔNG import Booking entity hay BookingRepository trực tiếp.
 */
@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingService bookingService;

    public ReviewServiceImpl(ReviewRepository reviewRepository, BookingService bookingService) {
        this.reviewRepository = reviewRepository;
        this.bookingService = bookingService;
    }

    @Override
    public ReviewResponse createReview(Long customerId, CreateReviewRequest request) {
        BookingSummaryResponse booking = bookingService.getBookingOrThrow(request.getBookingId());

        if (!booking.customerId().equals(customerId)) {
            throw new ForbiddenException("Bạn không phải khách hàng của lịch hẹn này");
        }

        if (!booking.isCompleted()) {
            throw new ValidationException("Chỉ có thể đánh giá sau khi lịch hẹn đã hoàn tất");
        }

        if (reviewRepository.existsByBookingId(request.getBookingId())) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Lịch hẹn này đã được đánh giá rồi");
        }

        Review review = new Review(
                request.getBookingId(),
                customerId,
                booking.salonId(),
                request.getRating(),
                request.getComment()
        );

        reviewRepository.save(review);
        return ReviewMapper.toResponse(review);
    }

    @Override
    public ReviewResponse updateReview(Long reviewId, Long customerId, UpdateReviewRequest request) {
        Review review = findOrThrow(reviewId);

        if (!review.isOwnedBy(customerId)) {
            throw new ForbiddenException("Bạn không phải chủ đánh giá này");
        }

        review.update(request.getRating(), request.getComment());
        return ReviewMapper.toResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReview(Long reviewId) {
        return ReviewMapper.toResponse(findOrThrow(reviewId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsBySalon(Long salonId, Pageable pageable) {
        return reviewRepository.findBySalonId(salonId, pageable).map(ReviewMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SalonRatingSummaryResponse getSalonRatingSummary(Long salonId) {
        Double average = reviewRepository.findAverageRatingBySalonId(salonId);
        long total = reviewRepository.countBySalonId(salonId);
        return new SalonRatingSummaryResponse(salonId, average != null ? average : 0.0, total);
    }

    private Review findOrThrow(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));
    }
}
