package be.exe.salon.repository;

import be.exe.salon.domain.Salon;
import be.exe.salon.domain.SalonStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Optional;

public interface SalonRepository extends JpaRepository<Salon, Long> {

    Page<Salon> findByOwnerId(Long ownerId, Pageable pageable);

    Page<Salon> findByStatus(SalonStatus status, Pageable pageable);

    long countByStatus(SalonStatus status);

    boolean existsByOwnerIdAndStatus(Long ownerId, SalonStatus status);

    boolean existsByGeoapifyPlaceId(String geoapifyPlaceId);

    boolean existsByGeoapifyPlaceIdAndIdNot(String geoapifyPlaceId, Long id);

    Optional<Salon> findByGeoapifyPlaceId(String geoapifyPlaceId);

    Optional<Salon> findFirstByPlatformManagedTrue();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Salon s WHERE s.id = :id")
    Optional<Salon> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Salon s SET s.ownerId = :ownerId WHERE s.platformManaged = true")
    int reassignPlatformManagedOwner(@Param("ownerId") Long ownerId);
}

