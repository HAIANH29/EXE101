package be.exe.auth.repository;

import be.exe.auth.domain.VerificationToken;
import be.exe.auth.domain.VerificationTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findTopByEmailAndTypeOrderByCreatedAtDesc(String email, VerificationTokenType type);
    Optional<VerificationToken> findByTokenAndType(String token, VerificationTokenType type);

    /** Đếm số mã đã phát cho email trong một khoảng thời gian (rate-limit). */
    long countByEmailAndTypeAndCreatedAtAfter(String email, VerificationTokenType type, Instant after);

    /** Vô hiệu tất cả mã còn hiệu lực của email trước khi phát mã mới. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE VerificationToken t SET t.used = true "
            + "WHERE t.email = :email AND t.type = :type AND t.used = false")
    int invalidateActiveTokens(@Param("email") String email, @Param("type") VerificationTokenType type);
}
