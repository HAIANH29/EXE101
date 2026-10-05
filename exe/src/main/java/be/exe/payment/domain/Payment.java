package be.exe.payment.domain;

import be.exe.common.exception.ValidationException;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * referenceCode = mã do CHÍNH HỆ THỐNG sinh ra (ví dụ "DH1023"), khách phải gõ đúng mã này
 * vào nội dung chuyển khoản. Khi SePay gửi webhook về, ta tìm payment khớp bằng cách
 * so khớp mã này có nằm trong nội dung chuyển khoản thật hay không.
 *
 * transactionId = mã giao dịch CỦA SEPAY (field "id" trong webhook), lưu lại để đối soát sau này.
 */
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cross-module (booking.Booking) - unique vì 1 booking chỉ có đúng 1 payment
    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 50)
    private PaymentProvider provider = PaymentProvider.SEPAY;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;

    /** Mã giao dịch chuyển khoản hoàn tiền (admin nhập sau khi chuyển thủ công). */
    @Column(name = "refund_reference")
    private String refundReference;

    @Column(name = "refund_requested_at")
    private Instant refundRequestedAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    @Column(name = "refunded_by")
    private Long refundedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Payment() {
    }

    public Payment(Long bookingId, BigDecimal amount, String referenceCode, String paymentUrl) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.referenceCode = referenceCode;
        this.paymentUrl = paymentUrl;
    }

    public void markPaid(String transactionId) {
        this.status = PaymentStatus.PAID;
        this.transactionId = transactionId;
        this.paidAt = Instant.now();
    }

    public void markCancelled() {
        this.status = PaymentStatus.CANCELLED;
    }

    /** Reset lại để thử thanh toán lần nữa (dùng khi lần trước bị hủy/thất bại). */
    public void reset(String newReferenceCode, String newPaymentUrl) {
        this.status = PaymentStatus.PENDING;
        this.referenceCode = newReferenceCode;
        this.paymentUrl = newPaymentUrl;
        this.transactionId = null;
        this.paidAt = null;
    }

    public boolean isPending() {
        return this.status == PaymentStatus.PENDING;
    }

    public boolean isPaid() {
        return this.status == PaymentStatus.PAID;
    }

    /** PAID -> REFUND_PENDING (booking đã thanh toán bị hủy). */
    public void requestRefund(String reason) {
        if (this.status != PaymentStatus.PAID) {
            throw new ValidationException("Chỉ payment PAID mới có thể yêu cầu hoàn tiền");
        }
        this.status = PaymentStatus.REFUND_PENDING;
        this.refundReason = reason;
        this.refundRequestedAt = Instant.now();
    }

    /** PAID hoặc REFUND_PENDING -> REFUNDED, sau khi admin đã chuyển khoản hoàn tiền. */
    public void markRefunded(BigDecimal refundAmount, String refundReference, String note, Long adminId) {
        if (this.status != PaymentStatus.PAID && this.status != PaymentStatus.REFUND_PENDING) {
            throw new ValidationException("Chỉ payment PAID hoặc REFUND_PENDING mới có thể hoàn tiền");
        }
        if (refundAmount == null || refundAmount.signum() <= 0 || refundAmount.compareTo(this.amount) > 0) {
            throw new ValidationException("Số tiền hoàn phải lớn hơn 0 và không vượt quá số tiền đã thanh toán");
        }
        if (this.refundRequestedAt == null) {
            this.refundRequestedAt = Instant.now();
        }
        if (note != null && !note.isBlank()) {
            this.refundReason = (this.refundReason == null || this.refundReason.isBlank())
                    ? note
                    : this.refundReason + " | " + note;
        }
        this.status = PaymentStatus.REFUNDED;
        this.refundAmount = refundAmount;
        this.refundReference = refundReference;
        this.refundedAt = Instant.now();
        this.refundedBy = adminId;
    }

    public Long getId() {
        return id;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public PaymentProvider getProvider() {
        return provider;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public String getRefundReason() {
        return refundReason;
    }

    public String getRefundReference() {
        return refundReference;
    }

    public Instant getRefundRequestedAt() {
        return refundRequestedAt;
    }

    public Instant getRefundedAt() {
        return refundedAt;
    }

    public Long getRefundedBy() {
        return refundedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
