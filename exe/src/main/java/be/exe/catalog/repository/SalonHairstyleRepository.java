package be.exe.catalog.repository;

import be.exe.catalog.domain.SalonHairstyle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SalonHairstyleRepository
        extends JpaRepository<SalonHairstyle, SalonHairstyle.SalonHairstyleId> {

    List<SalonHairstyle> findBySalonId(Long salonId);

    boolean existsBySalonIdAndHairstyleId(Long salonId, Long hairstyleId);

    void deleteBySalonIdAndHairstyleId(Long salonId, Long hairstyleId);
}
