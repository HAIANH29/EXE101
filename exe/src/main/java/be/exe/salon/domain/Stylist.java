package be.exe.salon.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "stylists")
public class Stylist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cross-module (auth.User) -> chỉ lưu id
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    // Cùng module với Salon, nhưng vẫn dùng plain Long cho nhất quán toàn bộ codebase,
    // tránh rủi ro N+1/lazy-loading khi query danh sách stylist.
    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StylistStatus status = StylistStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Stylist() {
    }

    public Stylist(Long userId, Long salonId) {
        this.userId = userId;
        this.salonId = salonId;
    }

    public boolean isActive() {
        return this.status == StylistStatus.ACTIVE;
    }

    public void updateInfo(String bio, Integer experienceYears) {
        this.bio = bio;
        this.experienceYears = experienceYears;
    }

    public void changeStatus(StylistStatus status) {
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getSalonId() {
        return salonId;
    }

    public String getBio() {
        return bio;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public StylistStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
