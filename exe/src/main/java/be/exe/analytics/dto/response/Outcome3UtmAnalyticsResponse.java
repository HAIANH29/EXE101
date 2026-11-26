package be.exe.analytics.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Báo cáo G3.3 – Hiệu quả theo kênh (UTM) theo khoảng ngày, dùng First-Touch Attribution.
 * Gồm chuỗi xu hướng phiên duy nhất theo ngày và bảng tổng hợp 3 nhóm kênh chính:
 * facebook / social, tiktok / social, (direct) / (none).
 */
public record Outcome3UtmAnalyticsResponse(
        LocalDate from,
        LocalDate to,
        List<DailyTrendPoint> trend,
        List<ChannelMetric> channels,
        ChannelSummary total
) {

    public record DailyTrendPoint(
            LocalDate date,
            long facebookSessions,
            long tiktokSessions,
            long directSessions
    ) {
    }

    public record ChannelMetric(
            String channelKey,
            String source,
            String medium,
            String sourceMedium,
            long sessions,
            long signups,
            long paidCustomers,
            long transactions,
            BigDecimal revenue,
            double signupToPaidPercent,
            double visitToPaidPercent,
            BigDecimal averageOrderValue
    ) {
    }

    public record ChannelSummary(
            long sessions,
            long signups,
            long paidCustomers,
            long transactions,
            BigDecimal revenue,
            double signupToPaidPercent,
            double visitToPaidPercent,
            BigDecimal averageOrderValue
    ) {
    }
}

