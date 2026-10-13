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
