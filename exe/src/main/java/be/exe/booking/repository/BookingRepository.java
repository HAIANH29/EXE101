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

    Page<Booking> findBySalonIdAndStartAtGreaterThanEqualAndStatusNotOrderByStartAtAsc(
            Long salonId, Instant from, BookingStatus status, Pageable pageable);

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
    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b
            WHERE b.stylistId = :stylistId
              AND b.status <> be.exe.booking.domain.BookingStatus.CANCELLED
              AND b.startAt < :endAt
              AND b.endAt > :startAt
            """)
    boolean existsOverlappingBooking(@Param("stylistId") Long stylistId,
                                      @Param("startAt") Instant startAt,
                                      @Param("endAt") Instant endAt);

    @Query("""
            SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b
            WHERE b.id <> :bookingId
              AND b.stylistId = :stylistId
              AND b.status <> be.exe.booking.domain.BookingStatus.CANCELLED
              AND b.startAt < :endAt
              AND b.endAt > :startAt
            """)
    boolean existsOverlappingBookingExcept(@Param("bookingId") Long bookingId,
                                            @Param("stylistId") Long stylistId,
                                            @Param("startAt") Instant startAt,
                                            @Param("endAt") Instant endAt);

    // ===== Dùng cho dashboard thống kê =====

    long countByStatus(BookingStatus status);

    long countByCreatedAtBetween(Instant from, Instant to);

    long countBySalonIdAndStatus(Long salonId, BookingStatus status);

    long countBySalonIdAndCreatedAtBetween(Long salonId, Instant from, Instant to);

    long countBySalonIdAndStartAtBetween(Long salonId, Instant from, Instant to);

    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.salonId = :salonId
              AND b.startAt >= :from
              AND b.status <> be.exe.booking.domain.BookingStatus.CANCELLED
            """)
    long countUpcomingBySalonId(@Param("salonId") Long salonId,
                                @Param("from") Instant from);

    @Query("""
            SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b
            WHERE b.salonId = :salonId
              AND b.status = be.exe.booking.domain.BookingStatus.COMPLETED
              AND b.createdAt BETWEEN :from AND :to
            """)
    BigDecimal sumRevenueBySalonIdBetween(@Param("salonId") Long salonId,
                                           @Param("from") Instant from,
                                           @Param("to") Instant to);

    /** Tổng doanh thu từ các booking đã hoàn tất trong khoảng thời gian. */
    @Query("""
            SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b
            WHERE b.status = be.exe.booking.domain.BookingStatus.COMPLETED
              AND b.createdAt BETWEEN :from AND :to
            """)
    BigDecimal sumRevenueBetween(@Param("from") Instant from, @Param("to") Instant to);
}
