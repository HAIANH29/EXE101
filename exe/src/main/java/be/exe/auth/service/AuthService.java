package be.exe.auth.service;

import be.exe.auth.dto.request.ChangePasswordRequest;
import be.exe.auth.dto.request.LoginRequest;
import be.exe.auth.dto.request.RefreshTokenRequest;
import be.exe.auth.dto.request.RegisterRequest;
import be.exe.auth.dto.response.LoginResponse;
import be.exe.auth.dto.response.TokenResponse;
import be.exe.auth.dto.response.UserResponse;

public interface AuthService {

    LoginResponse register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    TokenResponse refreshToken(RefreshTokenRequest request);

    void logout(RefreshTokenRequest request);

    void logoutAllDevices(Long userId);

    UserResponse getCurrentUser(Long userId);

    void changePassword(Long userId, ChangePasswordRequest request);
    LoginResponse loginOrRegisterViaOAuth2(String email, String fullName, String avatarUrl);
}
