package be.exe.review.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cross-module (booking.Booking) - unique vì mỗi booking chỉ được review 1 lần
    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;

    // Cross-module (auth.User)
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    // Cross-module (salon.Salon)
    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "rating", nullable = false)
    private Short rating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Review() {
    }

    public Review(Long bookingId, Long customerId, Long salonId, Short rating, String comment) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.salonId = salonId;
        this.rating = rating;
        this.comment = comment;
    }

    public boolean isOwnedBy(Long userId) {
        return this.customerId.equals(userId);
    }

    public void update(Short rating, String comment) {
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() {
        return id;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getSalonId() {
        return salonId;
    }

    public Short getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
