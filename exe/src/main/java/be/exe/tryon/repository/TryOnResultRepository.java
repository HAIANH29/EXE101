package be.exe.tryon.repository;

import be.exe.tryon.domain.TryOnResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

public interface TryOnResultRepository extends JpaRepository<TryOnResult, Long> {

    Optional<TryOnResult> findByRequestId(Long requestId);

    List<TryOnResult> findByRequestIdIn(Collection<Long> requestIds);

    boolean existsByRequestId(Long requestId);
}
