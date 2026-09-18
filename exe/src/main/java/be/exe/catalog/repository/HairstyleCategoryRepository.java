package be.exe.catalog.repository;

import be.exe.catalog.domain.HairstyleCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HairstyleCategoryRepository extends JpaRepository<HairstyleCategory, Long> {
}
