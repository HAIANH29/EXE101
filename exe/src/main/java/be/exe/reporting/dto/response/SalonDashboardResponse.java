package be.exe.reporting.dto.response;

import java.math.BigDecimal;

public record SalonDashboardResponse(
        Long salonId,
        long bookingsThisMonth,
        long bookingsToday,
        long upcomingBookings,
        long pendingBookings,
        long confirmedBookings,
        long completedBookings,
        long cancelledBookings,
        BigDecimal revenueThisMonth,
        long activeStylists
) {
}
