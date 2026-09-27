package be.exe.tryon.repository;

import be.exe.tryon.domain.TryOnResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TryOnResultRepository extends JpaRepository<TryOnResult, Long> {

    Optional<TryOnResult> findByRequestId(Long requestId);
}
