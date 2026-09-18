package be.exe.catalog.repository;

import be.exe.catalog.domain.ServiceOffering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {

    Page<ServiceOffering> findBySalonId(Long salonId, Pageable pageable);
}
