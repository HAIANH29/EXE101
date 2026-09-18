package be.exe.salon.repository;

import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalonRepository extends JpaRepository<Salon, Long> {

    Page<Salon> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Salon> findByStatus(SalonStatus status, Pageable pageable);

    long countByStatus(SalonStatus status);
}
