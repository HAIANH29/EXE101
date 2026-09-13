package be.exe.booking.repository;

import be.exe.booking.domain.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    Page<Booking> findBySalonId(Long salonId, Pageable pageable);

    Page<Booking> findByStylistId(Long stylistId, Pageable pageable);

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
}
