package be.exe.tryon.repository;

import be.exe.tryon.domain.TryOnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface TryOnRequestRepository extends JpaRepository<TryOnRequest, Long> {

    Page<TryOnRequest> findByUserId(Long userId, Pageable pageable);

    Page<TryOnRequest> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    Optional<TryOnRequest> findByIdAndUserId(Long id, Long userId);

    // ===== Dùng cho dashboard admin =====

    long countByCreatedAtBetween(OffsetDateTime from, OffsetDateTime to);

    /** Số người dùng khác nhau đã thử tóc AI (mọi trạng thái, toàn bộ thời gian). */
    @Query("SELECT COUNT(DISTINCT r.userId) FROM TryOnRequest r")
    long countDistinctUsers();

    @Query("""
            SELECT COUNT(DISTINCT r.userId) FROM TryOnRequest r
            WHERE r.createdAt BETWEEN :from AND :to
            """)
    long countDistinctUsersBetween(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);
}
