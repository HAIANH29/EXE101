package be.exe.auth.controller;

import be.exe.auth.dto.request.ChangePasswordRequest;
import be.exe.auth.dto.request.LoginRequest;
import be.exe.auth.dto.request.RefreshTokenRequest;
import be.exe.auth.dto.request.RegisterRequest;
import be.exe.auth.dto.response.LoginResponse;
import be.exe.auth.dto.response.TokenResponse;
import be.exe.auth.dto.response.UserResponse;
import be.exe.auth.service.AuthService;
import be.exe.common.response.ApiResponse;
import be.exe.common.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
            @AuthenticationPrincipal CustomUserDetails principal) {
        authService.logoutAllDevices(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Đã đăng xuất khỏi tất cả thiết bị"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails principal) {
        UserResponse response = authService.getCurrentUser(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }
}
