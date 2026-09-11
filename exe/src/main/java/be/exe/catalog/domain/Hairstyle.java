package be.exe.catalog.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "hairstyles")
public class Hairstyle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private HairstyleStatus status = HairstyleStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Hairstyle() {
    }

    public Hairstyle(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
    }

    public boolean isActive() {
        return this.status == HairstyleStatus.ACTIVE;
    }

    public void updateInfo(String name, String description, String imageUrl,
                            Long categoryId, Gender gender) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.categoryId = categoryId;
        this.gender = gender;
    }

    public void changeStatus(HairstyleStatus status) {
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Gender getGender() {
        return gender;
    }

    public HairstyleStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
