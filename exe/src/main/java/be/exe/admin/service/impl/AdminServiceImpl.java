package be.exe.admin.service.impl;

import be.exe.admin.service.AdminService;
import be.exe.auth.dto.response.UserResponse;
import be.exe.auth.service.AuthService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.service.SalonService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import be.exe.payment.service.PaymentService;
import be.exe.payment.dto.response.PaymentResponse;
import be.exe.admin.dto.request.RefundPaymentRequest;

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
    private final PaymentService paymentService;

    public AdminServiceImpl(AuthService authService, SalonService salonService, PaymentService paymentService) {
        this.authService = authService;
        this.salonService = salonService;
        this.paymentService = paymentService;
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

    @Override
    public UserResponse promoteToSalonOwner(Long userId) {
        return authService.promoteToSalonOwner(userId);
    }

    @Override
    public void deleteUser(Long adminUserId, Long userId) {
        if (adminUserId != null && adminUserId.equals(userId)) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Admin không thể tự xóa tài khoản của mình qua API quản trị");
        }
        authService.deleteAccount(userId);
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
    @Transactional(rollbackFor = Exception.class)
    public SalonResponse approveSalon(Long salonId) {
        SalonResponse response = salonService.approveSalon(salonId);
        authService.promoteToSalonOwner(response.ownerId());
        return response;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SalonResponse rejectSalon(Long salonId) {
        return salonService.rejectSalon(salonId);
    }

    // ===== Quản lý thanh toán =====

    @Override
    public PaymentResponse refundPayment(Long adminId, Long paymentId, RefundPaymentRequest request) {
        return paymentService.refundPayment(paymentId, request.refundAmount(), request.refundReference(), request.note(), adminId);
    }
}
