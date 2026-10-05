package be.exe.auth.repository;

import be.exe.auth.domain.VerificationToken;
import be.exe.auth.domain.VerificationTokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findTopByEmailAndTypeOrderByCreatedAtDesc(String email, VerificationTokenType type);
    Optional<VerificationToken> findByTokenAndType(String token, VerificationTokenType type);
}
