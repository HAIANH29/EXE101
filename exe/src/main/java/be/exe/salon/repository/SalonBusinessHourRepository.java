package be.exe.salon.repository;

import be.exe.salon.domain.SalonBusinessHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SalonBusinessHourRepository extends JpaRepository<SalonBusinessHour, Long> {

    List<SalonBusinessHour> findBySalonIdOrderByDayOfWeek(Long salonId);

    Optional<SalonBusinessHour> findBySalonIdAndDayOfWeek(Long salonId, Short dayOfWeek);
}
