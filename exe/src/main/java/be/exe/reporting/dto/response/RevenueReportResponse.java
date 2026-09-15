package be.exe.reporting.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record RevenueReportResponse(
        Instant from,
        Instant to,
        BigDecimal totalRevenue,
        long totalBookings
) {
}
