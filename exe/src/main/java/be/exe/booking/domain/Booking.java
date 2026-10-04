package be.exe.booking.domain;

import be.exe.common.exception.ValidationException;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Toàn bộ field tham chiếu module khác (customerId -> auth.User, salonId -> salon.Salon,
 * stylistId -> salon.Stylist, serviceId/hairstyleId -> catalog) đều chỉ lưu Long,
 * không dùng @ManyToOne - đúng nguyên tắc module boundary xuyên suốt dự án.
 *
 * totalAmount là SNAPSHOT giá tại thời điểm đặt lịch, KHÔNG tính lại từ ServiceOffering.price
 * mỗi lần đọc - tránh sai lệch lịch sử nếu salon đổi giá dịch vụ sau này.
 */
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "salon_id", nullable = false)
    private Long salonId;

    @Column(name = "stylist_id", nullable = false)
    private Long stylistId;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @Column(name = "hairstyle_id")
    private Long hairstyleId;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Booking() {
    }

    public Booking(Long customerId, Long salonId, Long stylistId, Long serviceId,
                   Long hairstyleId, Instant startAt, Instant endAt,
                   BigDecimal totalAmount, String note) {
        this.customerId = customerId;
        this.salonId = salonId;
        this.stylistId = stylistId;
        this.serviceId = serviceId;
        this.hairstyleId = hairstyleId;
        this.startAt = startAt;
        this.endAt = endAt;
        this.totalAmount = totalAmount;
        this.note = note;
    }

    public boolean isOwnedBy(Long userId) {
        return this.customerId.equals(userId);
    }

    public void confirm() {
        if (this.status != BookingStatus.PENDING) {
            throw new ValidationException("Chỉ booking PENDING mới có thể xác nhận");
        }
        this.status = BookingStatus.CONFIRMED;
    }

    public void cancel() {
        this.status = BookingStatus.CANCELLED;
    }

    public void complete() {
        if (this.status != BookingStatus.CONFIRMED) {
            throw new ValidationException("Chỉ booking CONFIRMED mới có thể hoàn tất");
        }
        this.status = BookingStatus.COMPLETED;
    }

    public void reschedule(Instant startAt, Instant endAt) {
        if (this.status != BookingStatus.PENDING && this.status != BookingStatus.CONFIRMED) {
            throw new ValidationException("Chỉ booking PENDING hoặc CONFIRMED mới có thể đổi lịch");
        }
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public Long getId() {
        return id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public Long getSalonId() {
        return salonId;
    }

    public Long getStylistId() {
        return stylistId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public Long getHairstyleId() {
        return hairstyleId;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getNote() {
        return note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
