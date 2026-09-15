package be.exe.auth.repository;

import be.exe.auth.domain.User;
import be.exe.auth.domain.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByStatus(UserStatus status, Pageable pageable);

    /** Dùng cho dashboard: đếm số user đăng ký mới trong khoảng thời gian. */
    long countByCreatedAtBetween(Instant from, Instant to);
}
