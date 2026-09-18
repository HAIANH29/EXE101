package be.exe.admin.service.impl;

import be.exe.admin.service.AdminService;
import be.exe.auth.dto.response.UserResponse;
import be.exe.auth.service.AuthService;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.service.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Module admin KHÔNG có domain/repository riêng - toàn bộ thao tác đi qua Service interface
 * của các module sở hữu dữ liệu (AuthService, SalonService).
 *
 * Đây là lý do admin không được phép có entity riêng: nó chỉ là tầng "điều phối" (orchestration),
 * mọi quy tắc nghiệp vụ vẫn nằm ở module sở hữu dữ liệu tương ứng.
 */
@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    private final AuthService authService;
    private final SalonService salonService;

    public AdminServiceImpl(AuthService authService, SalonService salonService) {
        this.authService = authService;
        this.salonService = salonService;
    }

    // ===== Quản lý người dùng =====

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String statusFilter, Pageable pageable) {
        return authService.getUsers(statusFilter, pageable);
    }

    @Override
    public UserResponse updateUserStatus(Long userId, String status) {
        return authService.updateUserStatus(userId, status);
    }

    // ===== Quản lý salon =====

    @Override
    @Transactional(readOnly = true)
    public Page<SalonResponse> getSalons(String statusFilter, Pageable pageable) {
        SalonStatus status = (statusFilter != null && !statusFilter.isBlank())
                ? SalonStatus.valueOf(statusFilter)
                : null;
        return salonService.getSalons(status, pageable);
    }

    @Override
    public SalonResponse approveSalon(Long salonId) {
        return salonService.updateSalonStatus(salonId, SalonStatus.ACTIVE);
    }

    @Override
    public SalonResponse rejectSalon(Long salonId) {
        return salonService.updateSalonStatus(salonId, SalonStatus.INACTIVE);
    }
}
