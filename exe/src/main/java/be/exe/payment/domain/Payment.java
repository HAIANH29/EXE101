package be.exe.payment.domain;

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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
