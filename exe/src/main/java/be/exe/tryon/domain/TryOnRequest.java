package be.exe.tryon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "tryon_requests")
public class TryOnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "hairstyle_id", nullable = false)
    private Long hairstyleId;

    @Column(name = "input_image_url", nullable = false, columnDefinition = "TEXT")
    private String inputImageUrl;

    @Column(name = "status", length = 30, nullable = false)
    private String status; // PENDING, DONE, FAILED

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getHairstyleId() {
        return hairstyleId;
    }

    public void setHairstyleId(Long hairstyleId) {
        this.hairstyleId = hairstyleId;
    }

    public String getInputImageUrl() {
        return inputImageUrl;
    }

    public void setInputImageUrl(String inputImageUrl) {
        this.inputImageUrl = inputImageUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
