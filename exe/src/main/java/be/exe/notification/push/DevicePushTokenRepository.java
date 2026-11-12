package be.exe.notification.push;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DevicePushTokenRepository extends JpaRepository<DevicePushToken, Long> {

    Optional<DevicePushToken> findByToken(String token);

    List<DevicePushToken> findByUserId(Long userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM DevicePushToken t WHERE t.token IN :tokens")
    void deleteByTokens(@Param("tokens") Collection<String> tokens);

    @Transactional
    @Modifying
    @Query("DELETE FROM DevicePushToken t WHERE t.token = :token AND t.userId = :userId")
    void deleteByTokenAndUser(@Param("token") String token, @Param("userId") Long userId);
}
