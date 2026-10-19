package be.exe.catalog.repository;

import be.exe.catalog.domain.HairstyleImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface HairstyleImageRepository extends JpaRepository<HairstyleImage, Long> {

    List<HairstyleImage> findByHairstyleIdInOrderByHairstyleIdAscSortOrderAsc(Collection<Long> hairstyleIds);

    // JPQL delete chạy ngay, tránh Hibernate flush insert trước delete khi thay cả gallery trong 1 transaction.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from HairstyleImage i where i.hairstyleId = :hairstyleId")
    void deleteByHairstyleId(@Param("hairstyleId") Long hairstyleId);
}
