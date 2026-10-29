package be.exe.payment.repository;

import be.exe.payment.domain.Payment;
import be.exe.payment.domain.PaymentStatus;
import be.exe.payment.domain.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBookingId(Long bookingId);

    Optional<Payment> findByTransactionId(String transactionId);

    Page<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);

    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);

    /**
     * Projection cho danh sách người dùng đã thanh toán trên trang quản trị.
     * Tổng hợp ở database để kết quả không bị giới hạn bởi trang giao dịch đang hiển thị ở FE.
     */
    interface PaidUserProjection {
        Long getCustomerId();

        String getFullName();

        String getEmail();

        String getPhone();

        long getPaidTransactionCount();

        java.math.BigDecimal getTotalPaidAmount();

        java.math.BigDecimal getTotalRefundedAmount();

        java.time.Instant getLastPaidAt();

        Long getLatestPaymentId();
    }

    @Query(value = """
            SELECT p.customer_id AS "customerId",
                   u.full_name AS "fullName",
                   u.email AS "email",
                   u.phone AS "phone",
                   COUNT(*) AS "paidTransactionCount",
                   COALESCE(SUM(p.amount), 0) AS "totalPaidAmount",
                   COALESCE(SUM(
                       CASE WHEN p.status = 'REFUNDED'
                            THEN COALESCE(p.refund_amount, p.amount)
                            ELSE 0 END
                   ), 0) AS "totalRefundedAmount",
                   MAX(p.paid_at) AS "lastPaidAt",
                   (ARRAY_AGG(p.id ORDER BY p.paid_at DESC NULLS LAST, p.id DESC))[1] AS "latestPaymentId"
            FROM payments p
            JOIN users u ON u.id = p.customer_id
            WHERE p.status IN ('PAID', 'REFUND_PENDING', 'REFUNDED')
            GROUP BY p.customer_id, u.full_name, u.email, u.phone
            ORDER BY MAX(p.paid_at) DESC NULLS LAST, MAX(p.id) DESC
            """,
            countQuery = """
                    SELECT COUNT(DISTINCT p.customer_id)
                    FROM payments p
                    WHERE p.status IN ('PAID', 'REFUND_PENDING', 'REFUNDED')
                    """,
            nativeQuery = true)
    Page<PaidUserProjection> findPaidUsers(Pageable pageable);

    Optional<Payment> findFirstByCustomerIdAndSalonIdAndPaymentTypeAndStatusIn(
            Long customerId, Long salonId, PaymentType paymentType, List<PaymentStatus> statuses);

    /**
     * Khách chuyển khoản, nội dung (content) thực tế có thể bị ngân hàng thêm ký tự thừa
     * (khoảng trắng, dấu, tên ngân hàng...), nên tìm bằng cách kiểm tra referenceCode
     * có NẰM TRONG content hay không, thay vì so khớp tuyệt đối.
     */
    @Query(value = """
            SELECT * FROM payments
            WHERE status = 'PENDING'
              AND LOWER(:content) LIKE '%' || LOWER(reference_code) || '%'
            """, nativeQuery = true)
    List<Payment> findPendingMatchingContent(@Param("content") String content);
}
