package be.exe.catalog.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * LƯU Ý ĐẶT TÊN: bảng SQL tên là "services", nhưng class Java đặt tên "ServiceOffering"
 * thay vì "Service" để tránh trùng/gây nhầm lẫn với annotation @Service của Spring Framework.
 */
@Entity
@Table(name = "services")
public class ServiceOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cross-module (salon.Salon) -> chỉ lưu id
    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ServiceStatus status = ServiceStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ServiceOffering() {
    }

    public ServiceOffering(Long salonId, String name, BigDecimal price, Integer durationMinutes) {
        this.salonId = salonId;
        this.name = name;
        this.price = price;
        this.durationMinutes = durationMinutes;
    }

    public boolean isActive() {
        return this.status == ServiceStatus.ACTIVE;
    }

    public void updateInfo(String name, String description, BigDecimal price, Integer durationMinutes) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.durationMinutes = durationMinutes;
    }

    public void changeStatus(ServiceStatus status) {
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public Long getSalonId() {
        return salonId;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public ServiceStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
