package be.exe.booking.repository;

import be.exe.booking.domain.Booking;
import be.exe.booking.domain.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    Page<Booking> findBySalonId(Long salonId, Pageable pageable);

    Page<Booking> findByStylistId(Long stylistId, Pageable pageable);

        List<Booking> findByStylistIdAndStartAtLessThanAndEndAtGreaterThanAndStatusNot(
          Long stylistId, Instant endAt, Instant startAt, BookingStatus status);

    List<Booking> findByStatusInAndRemindedFalseAndStartAtBetween(
            List<BookingStatus> statuses, Instant start, Instant end);

    /**
     * Kiểm tra trước (application-level) xem stylist đã có booking (chưa hủy) trùng khung giờ chưa.
     * Đây là lớp bảo vệ ĐẦU TIÊN, giúp trả lỗi thân thiện ngay khi tạo booking.
     * Lớp bảo vệ CUỐI CÙNG (bắt buộc, chống race condition) là exclusion constraint
     * "excl_stylist_overlap" ở tầng DB (xem V4__create_booking.sql) - dù app-level check này
     * có bị bypass do 2 request đồng thời, DB vẫn sẽ chặn đứng, AuthServiceImpl bắt
     * DataIntegrityViolationException để trả lỗi thân thiện tương tự.
     */
    @Query(value = """
            SELECT COUNT(*) > 0 FROM bookings
            WHERE stylist_id = :stylistId
              AND status <> 'CANCELLED'
              AND tstzrange(start_at, end_at) && tstzrange(:startAt, :endAt)
            """, nativeQuery = true)
    boolean existsOverlappingBooking(@Param("stylistId") Long stylistId,
                                      @Param("startAt") Instant startAt,
                                      @Param("endAt") Instant endAt);

    @Query(value = """
            SELECT COUNT(*) > 0 FROM bookings
            WHERE id <> :bookingId
              AND stylist_id = :stylistId
              AND status <> 'CANCELLED'
              AND tstzrange(start_at, end_at) && tstzrange(:startAt, :endAt)
            """, nativeQuery = true)
    boolean existsOverlappingBookingExcept(@Param("bookingId") Long bookingId,
                                            @Param("stylistId") Long stylistId,
                                            @Param("startAt") Instant startAt,
                                            @Param("endAt") Instant endAt);

    // ===== Dùng cho dashboard thống kê =====

    long countByStatus(BookingStatus status);

    long countByCreatedAtBetween(Instant from, Instant to);

    /** Tổng doanh thu từ các booking đã hoàn tất trong khoảng thời gian. */
    @Query("""
            SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b
            WHERE b.status = be.exe.booking.domain.BookingStatus.COMPLETED
              AND b.createdAt BETWEEN :from AND :to
            """)
    BigDecimal sumRevenueBetween(@Param("from") Instant from, @Param("to") Instant to);
}
