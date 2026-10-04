package be.exe.tryon.repository;

import be.exe.tryon.domain.TryOnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TryOnRequestRepository extends JpaRepository<TryOnRequest, Long> {

    Page<TryOnRequest> findByUserId(Long userId, Pageable pageable);

    Page<TryOnRequest> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    Optional<TryOnRequest> findByIdAndUserId(Long id, Long userId);
}
