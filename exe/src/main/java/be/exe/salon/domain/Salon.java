package be.exe.salon.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "salons")
public class Salon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Chỉ lưu id, KHÔNG @ManyToOne sang auth.User vì đó là module khác
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "geoapify_place_id", unique = true, length = 255)
    private String geoapifyPlaceId;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "is_demo", nullable = false)
    private boolean demo = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "listing_source", nullable = false, length = 30)
    private SalonListingSource listingSource = SalonListingSource.OWNER_SUBMITTED;

    @Column(name = "source_provider", nullable = false, length = 30)
    private String sourceProvider = "OWNER";

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "source_place_id", length = 255)
    private String sourcePlaceId;

    @Column(name = "location_verified_at")
    private Instant locationVerifiedAt;

    @Column(name = "booking_enabled", nullable = false)
    private boolean bookingEnabled = false;

    @Column(name = "platform_managed", nullable = false)
    private boolean platformManaged = false;

    @Column(name = "business_hours_verified", nullable = false)
    private boolean businessHoursVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private SalonStatus status = SalonStatus.PENDING_APPROVAL;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Salon() {
    }

    public Salon(Long ownerId, String name) {
        this.ownerId = ownerId;
        this.name = name;
    }

    public boolean isOwnedBy(Long userId) {
        return this.ownerId.equals(userId);
    }

    public boolean isActive() {
        return this.status == SalonStatus.ACTIVE;
    }

    public void updateInfo(String name, String phone, String address,
                            String description, String imageUrl) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    public void changeStatus(SalonStatus status) {
        this.status = status;
        if (status != SalonStatus.ACTIVE) {
            this.bookingEnabled = false;
        }
    }

    public void linkGeoapifyLocation(String placeId, Double latitude, Double longitude) {
        this.geoapifyPlaceId = placeId;
        this.sourceProvider = "GEOAPIFY";
        this.sourcePlaceId = placeId;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void markDemo() {
        this.demo = true;
        this.listingSource = SalonListingSource.GEOAPIFY_DEMO;
        this.sourceProvider = "GEOAPIFY";
        this.sourcePlaceId = this.geoapifyPlaceId;
        this.bookingEnabled = true;
    }

    public void disableBooking() {
        this.bookingEnabled = false;
    }

    public void enableBooking() {
        this.bookingEnabled = true;
    }

    public void markLocationVerified() {
        this.locationVerifiedAt = Instant.now();
    }

    public void markBusinessHoursVerified() {
        this.businessHoursVerified = true;
    }

    public Long getId() {
        return id;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }

    public String getAddress() {
        return address;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getGeoapifyPlaceId() {
        return geoapifyPlaceId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public boolean isDemo() {
        return demo;
    }

    public SalonListingSource getListingSource() {
        return listingSource;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public String getSourceProvider() {
        return sourceProvider;
    }

    public String getSourcePlaceId() {
        return sourcePlaceId;
    }

    public Instant getLocationVerifiedAt() {
        return locationVerifiedAt;
    }

    public boolean isBookingEnabled() {
        return bookingEnabled;
    }

    public boolean isPlatformManaged() {
        return platformManaged;
    }

    public boolean isBusinessHoursVerified() {
        return businessHoursVerified;
    }

    public SalonStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
