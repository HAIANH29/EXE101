package be.exe.catalog.repository;

import be.exe.catalog.domain.Hairstyle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HairstyleRepository extends JpaRepository<Hairstyle, Long> {

    Page<Hairstyle> findByCategoryId(Long categoryId, Pageable pageable);
}
