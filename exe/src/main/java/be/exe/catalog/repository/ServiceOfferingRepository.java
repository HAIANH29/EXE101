package be.exe.catalog.repository;

import be.exe.catalog.domain.ServiceOffering;
import be.exe.catalog.domain.ServiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {

    Page<ServiceOffering> findBySalonId(Long salonId, Pageable pageable);

    Page<ServiceOffering> findBySalonIdAndStatus(Long salonId, ServiceStatus status, Pageable pageable);
}
