package be.exe.analytics.dto.response;

import java.util.List;

public record TrafficReportResponse(
        int days,
        long totalVisits,
        long uniqueSessions,
        // Gộp theo utm_source + utm_medium
        List<TrafficSourceRow> bySource,
        // Chi tiết theo từng chiến dịch (utm_campaign), chỉ gồm lượt có campaign
        List<TrafficSourceRow> byCampaign
) {
}
