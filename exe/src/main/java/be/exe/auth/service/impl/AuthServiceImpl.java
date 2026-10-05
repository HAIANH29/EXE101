package be.exe.auth.service.impl;

import be.exe.auth.domain.PasswordResetToken;
import be.exe.auth.domain.RefreshToken;
import be.exe.auth.domain.Role;
import be.exe.auth.domain.RoleName;
import be.exe.auth.domain.User;
import be.exe.auth.domain.UserStatus;
import be.exe.auth.dto.request.ChangePasswordRequest;
import be.exe.auth.dto.request.ForgotPasswordRequest;
import be.exe.auth.dto.request.LoginRequest;
import be.exe.auth.dto.request.RefreshTokenRequest;
import be.exe.auth.dto.request.RegisterRequest;
import be.exe.auth.dto.request.ResetPasswordRequest;
import be.exe.auth.dto.request.UpdateProfileRequest;
import be.exe.auth.dto.response.LoginResponse;
import be.exe.auth.dto.response.TokenResponse;
import be.exe.auth.dto.response.UserResponse;
import be.exe.auth.mapper.UserMapper;
import be.exe.auth.repository.PasswordResetTokenRepository;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Set<String> ALLOWED_AVATAR_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final JavaMailSender mailSender;

    @Value("${app.password-reset.expiration-minutes:30}")
    private long passwordResetExpirationMinutes;

    @Value("${app.password-reset.mail-enabled:false}")
    private boolean passwordResetMailEnabled;

    @Value("${app.password-reset.frontend-reset-url:http://localhost:8082/reset-password}")
    private String defaultPasswordResetUrl;

    @Value("${app.password-reset.mail-from:}")
    private String passwordResetMailFrom;

    @Value("${app.upload.root-dir:uploads}")
    private String uploadRootDir;

    @Value("${app.upload.public-base-url:http://localhost:8080}")
    private String uploadPublicBaseUrl;

    @Value("${app.upload.avatar-max-size-bytes:5242880}")
    private long avatarMaxSizeBytes;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuthenticationManager authenticationManager,
                           JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.mailSender = mailSender;
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

        if (!user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        }

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
    public UserResponse updateCurrentUser(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        user.updateProfile(
                request.getFullName().trim(),
                normalizeOptionalText(request.getPhone())
        );

        return UserMapper.toResponse(user);
    }

    @Override
    public UserResponse uploadAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Vui lòng chọn ảnh đại diện");
        }

        if (file.getSize() > avatarMaxSizeBytes) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Ảnh đại diện không được vượt quá 5MB");
        }

        String contentType = file.getContentType() != null
                ? file.getContentType().toLowerCase(Locale.ROOT)
                : "";
        if (!ALLOWED_AVATAR_TYPES.contains(contentType)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        String extension = extensionFromContentType(contentType);
        String filename = "user-" + userId + "-" + UUID.randomUUID() + extension;
        Path avatarDir = Path.of(uploadRootDir, "avatars").toAbsolutePath().normalize();
        Path target = avatarDir.resolve(filename).normalize();

        try {
            Files.createDirectories(avatarDir);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            log.error("Could not store avatar for user {}", userId, ex);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Không lưu được ảnh đại diện");
        }

        user.setAvatarUrl(buildPublicUploadUrl("/uploads/avatars/" + filename));
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
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim();

        userRepository.findByEmail(email)
                .filter(User::isEnabled)
                .ifPresent(user -> {
                    passwordResetTokenRepository.markAllUnusedByUserId(user.getId());

                    String rawToken = generateSecureToken();
                    Instant expiresAt = Instant.now().plus(
                            Duration.ofMinutes(Math.max(1, passwordResetExpirationMinutes)));

                    PasswordResetToken token = new PasswordResetToken(
                            user,
                            HashUtils.sha256(rawToken),
                            expiresAt
                    );
                    passwordResetTokenRepository.save(token);

                    String resetUrl = buildResetUrl(
                            resolveResetBaseUrl(request.getRedirectUrl()),
                            rawToken,
                            user.getEmail());

                    sendPasswordResetEmail(user, resetUrl);
                });
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHash(HashUtils.sha256(request.getToken().trim()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN));

        if (!resetToken.isUsable()) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN);
        }

        User user = resetToken.getUser();
        user.changePassword(passwordEncoder.encode(request.getNewPassword()));
        resetToken.markUsed();

        passwordResetTokenRepository.markAllUnusedByUserId(user.getId());
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    @Override
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        refreshTokenRepository.revokeAllByUserId(userId);
        user.markDeleted(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
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

        if (user.isDeleted()) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Tài khoản đã bị xóa, không thể thay đổi trạng thái"
            );
        }

        UserStatus newStatus = UserStatus.valueOf(status);
        if (newStatus == UserStatus.DELETED) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_FAILED,
                    "Dùng API xóa tài khoản thay vì cập nhật trạng thái DELETED"
            );
        }

        user.setStatus(newStatus);
        if (newStatus != UserStatus.ACTIVE) {
            refreshTokenRepository.revokeAllByUserId(userId);
        }

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

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String resolveResetBaseUrl(String redirectUrl) {
        if (redirectUrl == null || redirectUrl.isBlank()) {
            return defaultPasswordResetUrl;
        }

        String value = redirectUrl.trim();
        if (value.startsWith("http://localhost:")
                || value.startsWith("https://")
                || value.startsWith("stylelock://")) {
            return value;
        }

        log.warn("Ignoring unsupported password reset redirect URL: {}", value);
        return defaultPasswordResetUrl;
    }

    private String buildResetUrl(String baseUrl, String rawToken, String email) {
        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl
                + separator
                + "token="
                + urlEncode(rawToken)
                + "&email="
                + urlEncode(email);
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String extensionFromContentType(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private String buildPublicUploadUrl(String path) {
        String baseUrl = uploadPublicBaseUrl == null ? "" : uploadPublicBaseUrl.trim();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl + path;
    }

    private void sendPasswordResetEmail(User user, String resetUrl) {
        if (!passwordResetMailEnabled) {
            log.info("Password reset mail disabled. Reset link for {}: {}", user.getEmail(), resetUrl);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (passwordResetMailFrom != null && !passwordResetMailFrom.isBlank()) {
            message.setFrom(passwordResetMailFrom);
        }
        message.setTo(user.getEmail());
        message.setSubject("StyleLock password reset");
        message.setText("""
                Hello %s,

                We received a request to reset your StyleLock password.
                Open this verification link to set a new password:

                %s

                This link expires in %d minutes. If you did not request this, you can ignore this email.
                """.formatted(user.getFullName(), resetUrl, Math.max(1, passwordResetExpirationMinutes)));

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Could not send password reset email to {}", user.getEmail(), ex);
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "Không gửi được email khôi phục mật khẩu. Vui lòng kiểm tra cấu hình Gmail SMTP");
        }
    }
}
