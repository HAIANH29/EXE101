package be.exe.analytics.controller;

import be.exe.analytics.dto.response.TrafficReportResponse;
import be.exe.analytics.service.TrafficAnalyticsService;
import be.exe.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTrafficController {

    private final TrafficAnalyticsService service;

    public AdminTrafficController(TrafficAnalyticsService service) {
        this.service = service;
    }

    /** Nguồn truy cập theo UTM trong N ngày gần nhất (mặc định 30). */
    @GetMapping("/traffic")
    public ResponseEntity<ApiResponse<TrafficReportResponse>> getTraffic(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(service.getReport(days)));
    }
}
