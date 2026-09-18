package be.exe.reporting.dto.response;

import java.math.BigDecimal;

/**
 * Số liệu tổng quan hiển thị ở trang dashboard.
 * Dữ liệu được tổng hợp từ nhiều module (auth, salon, booking) thông qua Service interface,
 * KHÔNG dùng JOIN SQL xuyên module - đây là đánh đổi có chủ đích: chậm hơn 1 chút
 * (nhiều query nhỏ thay vì 1 query lớn) nhưng giữ được ranh giới module rõ ràng.
 */
public record DashboardOverviewResponse(
        // Người dùng
        long totalUsers,
        long newUsersThisMonth,

        // Salon
        long totalSalons,
        long activeSalons,
        long pendingApprovalSalons,

        // Booking
        long totalBookingsThisMonth,
        long pendingBookings,
        long completedBookings,
        long cancelledBookings,

        // Doanh thu
        BigDecimal revenueThisMonth
) {
}
