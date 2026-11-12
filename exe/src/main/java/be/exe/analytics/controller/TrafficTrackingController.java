package be.exe.analytics.controller;

import be.exe.analytics.dto.request.TrackVisitRequest;
import be.exe.analytics.service.TrafficAnalyticsService;
import be.exe.analytics.service.VisitRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint công khai (/api/public/** đã permitAll) để app khách gửi UTM khi người dùng vào web. */
@RestController
@RequestMapping("/api/public/analytics")
public class TrafficTrackingController {

    private final TrafficAnalyticsService service;
    private final VisitRateLimiter rateLimiter;

    public TrafficTrackingController(TrafficAnalyticsService service, VisitRateLimiter rateLimiter) {
        this.service = service;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/visit")
    public ResponseEntity<Void> trackVisit(@RequestBody TrackVisitRequest request,
                                           HttpServletRequest http) {
        if (!rateLimiter.tryAcquire(clientIp(http))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        service.trackVisit(request);
        return ResponseEntity.noContent().build();
    }

    /** Sau proxy (Render) IP thật nằm ở phần tử đầu của X-Forwarded-For. */
    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }
}
