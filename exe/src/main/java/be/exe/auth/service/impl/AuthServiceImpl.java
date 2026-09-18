package be.exe.auth.service.impl;

import be.exe.auth.domain.RefreshToken;
import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.domain.UserStatus;
import be.exe.auth.dto.request.ChangePasswordRequest;
import be.exe.auth.dto.request.LoginRequest;
import be.exe.auth.dto.request.RefreshTokenRequest;
import be.exe.auth.dto.request.RegisterRequest;
import be.exe.auth.dto.response.LoginResponse;
import be.exe.auth.dto.response.TokenResponse;
import be.exe.auth.dto.response.UserResponse;
import be.exe.auth.mapper.UserMapper;
import be.exe.auth.repository.RefreshTokenRepository;
import be.exe.auth.repository.RoleRepository;
import be.exe.auth.repository.UserRepository;
import be.exe.auth.service.AuthService;
import be.exe.common.exception.BusinessException;
import be.exe.common.exception.ErrorCode;
import be.exe.common.exception.ResourceNotFoundException;
import be.exe.common.security.JwtService;
import be.exe.common.util.HashUtils;
import io.jsonwebtoken.Claims;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseThrow(() -> new IllegalStateException(
                        "Role CUSTOMER chưa được seed trong DB - kiểm tra lại migration V1"));

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName()
        );

        user.setPhone(request.getPhone());
        user.addRole(customerRole);

        userRepository.save(user);

        // Tự động đăng nhập luôn sau khi đăng ký thành công
        return buildLoginResponse(user);
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

        } catch (DisabledException | LockedException e) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);

        } catch (AuthenticationException e) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        return buildLoginResponse(user);
    }

    @Override
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();

        if (!jwtService.isValid(rawToken)) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String tokenHash = HashUtils.sha256(rawToken);

        RefreshToken storedToken =
                refreshTokenRepository.findByTokenHash(tokenHash)
                        .orElseThrow(() ->
                                new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));

        if (!storedToken.isValid()) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        User user = storedToken.getUser();

        // Rotate refresh token
        storedToken.revoke();

        String newAccessToken = generateAccessToken(user);
        String newRefreshToken = generateAndStoreRefreshToken(user);

        Claims claims = jwtService.parseClaims(newAccessToken);

        long expiresInSeconds =
                (claims.getExpiration().getTime()
                        - System.currentTimeMillis()) / 1000;

        return new TokenResponse(
                newAccessToken,
                newRefreshToken,
                expiresInSeconds
        );
    }

    @Override
    public void logout(RefreshTokenRequest request) {
        String tokenHash = HashUtils.sha256(
                request.getRefreshToken()
        );

        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresent(RefreshToken::revoke);
    }

    @Override
    public void logoutAllDevices(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        return UserMapper.toResponse(user);
    }

    @Override
    public void changePassword(
            Long userId,
            ChangePasswordRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(
                request.getOldPassword(),
                user.getPasswordHash())) {

            throw new BusinessException(
                    ErrorCode.INVALID_CREDENTIALS,
                    "Mật khẩu hiện tại không đúng"
            );
        }

        user.changePassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );
    }

    @Override
    public LoginResponse loginOrRegisterViaOAuth2(
            String email,
            String fullName,
            String avatarUrl) {

        User user = userRepository.findByEmail(email)
                .orElseGet(() ->
                        createOAuth2User(email, fullName));

        // Cập nhật avatar mới nhất từ Google
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }

        if (!user.isEnabled()) {
            throw new BusinessException(
                    ErrorCode.ACCOUNT_DISABLED
            );
        }

        return buildLoginResponse(user);
    }

    private User createOAuth2User(
            String email,
            String fullName) {

        Role customerRole =
                roleRepository.findByName(RoleName.CUSTOMER)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Role CUSTOMER chưa được seed trong DB - kiểm tra lại migration V1"
                                ));

        // Tài khoản Google không có password thật
        String randomPassword =
                passwordEncoder.encode(
                        java.util.UUID.randomUUID().toString()
                );

        User user = new User(
                email,
                randomPassword,
                fullName
        );

        user.addRole(customerRole);

        userRepository.save(user);

        return user;
    }

    // ===== Dùng bởi module admin =====

    @Override
    public UserResponse updateUserStatus(
            Long userId,
            String status) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User",
                                userId
                        ));

        user.setStatus(
                UserStatus.valueOf(status)
        );

        return UserMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(
            String statusFilter,
            Pageable pageable) {

        Page<User> page =
                (statusFilter != null && !statusFilter.isBlank())
                        ? userRepository.findByStatus(
                        UserStatus.valueOf(statusFilter),
                        pageable
                )
                        : userRepository.findAll(pageable);

        return page.map(UserMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUsers() {
        return userRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countNewUsers(
            Instant from,
            Instant to) {

        return userRepository.countByCreatedAtBetween(
                from,
                to
        );
    }

    // ===== Private helpers =====

    private LoginResponse buildLoginResponse(User user) {

        String accessToken =
                generateAccessToken(user);

        String refreshToken =
                generateAndStoreRefreshToken(user);

        Claims claims =
                jwtService.parseClaims(accessToken);

        long expiresInSeconds =
                (claims.getExpiration().getTime()
                        - System.currentTimeMillis()) / 1000;

        return new LoginResponse(
                accessToken,
                refreshToken,
                expiresInSeconds,
                UserMapper.toResponse(user)
        );
    }

    private String generateAccessToken(User user) {

        List<String> roleNames =
                user.getRoles().stream()
                        .map(Role::getName)
                        .map(Enum::name)
                        .toList();

        return jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                roleNames
        );
    }

    private String generateAndStoreRefreshToken(
            User user) {

        String refreshTokenJwt =
                jwtService.generateRefreshToken(
                        user.getId()
                );

        Claims claims =
                jwtService.parseClaims(
                        refreshTokenJwt
                );

        Instant expiresAt =
                claims.getExpiration().toInstant();

        RefreshToken entity =
                new RefreshToken(
                        user,
                        HashUtils.sha256(refreshTokenJwt),
                        expiresAt
                );

        refreshTokenRepository.save(entity);

        return refreshTokenJwt;
    }
}