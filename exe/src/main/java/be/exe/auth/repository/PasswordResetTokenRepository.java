package be.exe.auth.repository;

import be.exe.auth.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    default void markAllUnusedByUserId(Long userId) {
        markAllUnusedByUserId(userId, Instant.now());
    }

    @Modifying
    @Query("UPDATE PasswordResetToken prt SET prt.usedAt = :now " +
            "WHERE prt.user.id = :userId AND prt.usedAt IS NULL")
    void markAllUnusedByUserId(@Param("userId") Long userId, @Param("now") Instant now);
}
