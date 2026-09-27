package be.exe.tryon.repository;

import be.exe.tryon.domain.TryOnRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TryOnRequestRepository extends JpaRepository<TryOnRequest, Long> {

    Page<TryOnRequest> findByUserId(Long userId, Pageable pageable);
}
