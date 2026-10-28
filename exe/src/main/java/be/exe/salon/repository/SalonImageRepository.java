package be.exe.salon.repository;

import be.exe.salon.domain.SalonImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface SalonImageRepository extends JpaRepository<SalonImage, Long> {

    List<SalonImage> findBySalonIdInOrderBySalonIdAscSortOrderAsc(Collection<Long> salonIds);

    List<SalonImage> findBySalonIdOrderBySortOrderAsc(Long salonId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from SalonImage i where i.salonId = :salonId")
    void deleteBySalonId(@Param("salonId") Long salonId);
}
