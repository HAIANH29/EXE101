package be.exe.salon.repository;

import be.exe.salon.domain.Stylist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StylistRepository extends JpaRepository<Stylist, Long> {

    Page<Stylist> findBySalonId(Long salonId, Pageable pageable);

    Optional<Stylist> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
