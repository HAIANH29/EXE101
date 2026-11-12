package be.exe.analytics.service;

import be.exe.analytics.domain.TrafficVisit;
import be.exe.analytics.dto.request.TrackVisitRequest;
import be.exe.analytics.dto.response.TrafficReportResponse;
import be.exe.analytics.repository.TrafficVisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TrafficAnalyticsService {

    private static final int MAX_DAYS = 365;
    private static final int MAX_ROWS = 20;

    private final TrafficVisitRepository repository;

    public TrafficAnalyticsService(TrafficVisitRepository repository) {
        this.repository = repository;
    }

    /**
     * Ghi nhận 1 lượt truy cập. Không có utm_source thì lưu "direct" / "none" (giống cách GA4 gom lưu lượng trực tiếp).
     * Giá trị UTM được chuẩn hoá chữ thường để "Facebook" và "facebook" gộp chung một nguồn.
     */
    @Transactional
    public void trackVisit(TrackVisitRequest request) {
        String sessionId = clean(request.sessionId(), 64, false);
        if (sessionId == null) {
            sessionId = UUID.randomUUID().toString();
        }
        String source = clean(request.utmSource(), 100, true);
        String medium = clean(request.utmMedium(), 100, true);

        repository.save(new TrafficVisit(
                sessionId,
                source != null ? source : "direct",
                medium != null ? medium : "none",
                clean(request.utmCampaign(), 150, true),
                clean(request.utmTerm(), 150, true),
                clean(request.utmContent(), 150, true),
                clean(request.landingPath(), 255, false),
                clean(request.referrer(), 500, false)));
    }

    @Transactional(readOnly = true)
    public TrafficReportResponse getReport(int days) {
        int range = Math.min(Math.max(days, 1), MAX_DAYS);
        Instant from = Instant.now().minus(Duration.ofDays(range));
        return new TrafficReportResponse(
                range,
                repository.countByCreatedAtGreaterThanEqual(from),
                repository.countDistinctSessionsSince(from),
                limit(repository.summarizeBySource(from)),
                limit(repository.summarizeByCampaign(from)));
    }

    private static <T> List<T> limit(List<T> rows) {
        return rows.size() > MAX_ROWS ? rows.subList(0, MAX_ROWS) : rows;
    }

    private static String clean(String value, int maxLength, boolean lowerCase) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        if (lowerCase) trimmed = trimmed.toLowerCase(Locale.ROOT);
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }
}
