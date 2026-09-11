package be.exe.auth.repository;

import be.exe.auth.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Dùng cho chức năng "đăng xuất tất cả thiết bị" - revoke toàn bộ token còn hiệu lực của 1 user.
     */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = CURRENT_TIMESTAMP " +
            "WHERE rt.user.id = :userId AND rt.revokedAt IS NULL")
    void revokeAllByUserId(@Param("userId") Long userId);
}
