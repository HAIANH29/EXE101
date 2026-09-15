package be.exe.review.repository;

import be.exe.review.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findBySalonId(Long salonId, Pageable pageable);

    Optional<Review> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.salonId = :salonId")
    Double findAverageRatingBySalonId(@Param("salonId") Long salonId);

    long countBySalonId(Long salonId);
}
