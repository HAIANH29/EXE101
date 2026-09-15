package be.exe.admin.controller;

import be.exe.admin.dto.request.UpdateUserStatusRequest;
import be.exe.admin.service.AdminService;
import be.exe.auth.dto.response.UserResponse;
import be.exe.common.response.ApiResponse;
import be.exe.common.response.PageResponse;
import be.exe.common.util.PaginationUtils;
import be.exe.salon.dto.response.SalonResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Toàn bộ endpoint trong controller này đều yêu cầu role ADMIN
 * (khai báo 1 lần ở class-level thay vì lặp lại trên từng method).
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ===== Quản lý người dùng =====

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size, "createdAt", "DESC");
        var result = adminService.getUsers(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserResponse response = adminService.updateUserStatus(userId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái tài khoản", response));
    }

    // ===== Quản lý salon =====

    @GetMapping("/salons")
    public ResponseEntity<ApiResponse<PageResponse<SalonResponse>>> getSalons(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        var pageable = PaginationUtils.of(page, size, "createdAt", "DESC");
        var result = adminService.getSalons(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PatchMapping("/salons/{salonId}/approve")
    public ResponseEntity<ApiResponse<SalonResponse>> approveSalon(@PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã duyệt salon", adminService.approveSalon(salonId)));
    }

    @PatchMapping("/salons/{salonId}/reject")
    public ResponseEntity<ApiResponse<SalonResponse>> rejectSalon(@PathVariable Long salonId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối salon", adminService.rejectSalon(salonId)));
    }
}
