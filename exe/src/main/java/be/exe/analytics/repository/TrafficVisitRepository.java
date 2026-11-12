package be.exe.analytics.repository;

import be.exe.analytics.domain.TrafficVisit;
import be.exe.analytics.dto.response.TrafficSourceRow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface TrafficVisitRepository extends JpaRepository<TrafficVisit, Long> {

    long countByCreatedAtGreaterThanEqual(Instant from);

    @Query("SELECT COUNT(DISTINCT v.sessionId) FROM TrafficVisit v WHERE v.createdAt >= :from")
    long countDistinctSessionsSince(@Param("from") Instant from);

    @Query("""
            SELECT new be.exe.analytics.dto.response.TrafficSourceRow(
                v.utmSource, v.utmMedium, '', COUNT(v), COUNT(DISTINCT v.sessionId))
            FROM TrafficVisit v
            WHERE v.createdAt >= :from
            GROUP BY v.utmSource, v.utmMedium
            ORDER BY COUNT(v) DESC
            """)
    List<TrafficSourceRow> summarizeBySource(@Param("from") Instant from);

    @Query("""
            SELECT new be.exe.analytics.dto.response.TrafficSourceRow(
                v.utmSource, v.utmMedium, v.utmCampaign, COUNT(v), COUNT(DISTINCT v.sessionId))
            FROM TrafficVisit v
            WHERE v.createdAt >= :from AND v.utmCampaign IS NOT NULL
            GROUP BY v.utmSource, v.utmMedium, v.utmCampaign
            ORDER BY COUNT(v) DESC
            """)
    List<TrafficSourceRow> summarizeByCampaign(@Param("from") Instant from);
}
