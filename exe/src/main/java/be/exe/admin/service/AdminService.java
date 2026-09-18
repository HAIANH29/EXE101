package be.exe.admin.service;

import be.exe.auth.dto.response.UserResponse;
import be.exe.salon.dto.response.SalonResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Module admin: QUẢN LÝ dữ liệu (khóa user, duyệt salon) - có ghi/sửa.
 * Phần thống kê/báo cáo read-only nằm ở module reporting riêng.
 */
public interface AdminService {

    // ===== Quản lý người dùng =====

    Page<UserResponse> getUsers(String statusFilter, Pageable pageable);

    UserResponse updateUserStatus(Long userId, String status);

    // ===== Quản lý salon =====

    Page<SalonResponse> getSalons(String statusFilter, Pageable pageable);

    SalonResponse approveSalon(Long salonId);

    SalonResponse rejectSalon(Long salonId);
}
