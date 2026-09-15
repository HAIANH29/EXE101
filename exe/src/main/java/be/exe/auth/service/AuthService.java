package be.exe.auth.service;

import be.exe.auth.dto.request.ChangePasswordRequest;
import be.exe.auth.dto.request.LoginRequest;
import be.exe.auth.dto.request.RefreshTokenRequest;
import be.exe.auth.dto.request.RegisterRequest;
import be.exe.auth.dto.response.LoginResponse;
import be.exe.auth.dto.response.TokenResponse;
import be.exe.auth.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;

public interface AuthService {

    LoginResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    TokenResponse refreshToken(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    void logoutAllDevices(Long userId);

    UserResponse getCurrentUser(Long userId);

    void changePassword(Long userId, ChangePasswordRequest request);

    /**
     * Đăng nhập qua Google OAuth2 - nếu email chưa tồn tại thì tự tạo tài khoản mới (role CUSTOMER),
     * nếu đã tồn tại thì đăng nhập bình thường và cập nhật avatar mới nhất từ Google.
     */
    LoginResponse loginOrRegisterViaOAuth2(String email, String fullName, String avatarUrl);

    // ===== Dùng bởi module admin =====

    /** Khóa/mở khóa tài khoản. status: ACTIVE / INACTIVE / BANNED */
    UserResponse updateUserStatus(Long userId, String status);

    Page<UserResponse> getUsers(String statusFilter, Pageable pageable);

    /** Dùng cho dashboard: tổng số user + số đăng ký mới trong khoảng thời gian. */
    long countUsers();

    long countNewUsers(Instant from, Instant to);
}
