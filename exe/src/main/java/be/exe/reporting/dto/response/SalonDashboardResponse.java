package be.exe.reporting.dto.response;

import java.math.BigDecimal;
import java.util.List;

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
        long activeStylists,
        // Tổng số booking mọi trạng thái (toàn bộ thời gian)
        long totalBookings,
        // Tổng doanh thu các booking COMPLETED trong khoảng revenueByMonth
        BigDecimal totalRevenue,
        // Doanh thu 6 tháng gần nhất (cũ -> mới), tính theo ngày diễn ra dịch vụ
        List<MonthlyRevenue> revenueByMonth
) {

    /** month có dạng yyyy-MM (giờ Việt Nam). */
    public record MonthlyRevenue(String month, BigDecimal revenue) {
    }
}
