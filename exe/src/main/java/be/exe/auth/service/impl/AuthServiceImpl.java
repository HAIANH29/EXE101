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
import be.exe.auth.repository.VerificationTokenRepository;
import be.exe.auth.domain.VerificationToken;
import be.exe.auth.domain.VerificationTokenType;
import be.exe.auth.dto.request.SendOtpRequest;
import be.exe.auth.dto.request.VerifyOtpRequest;
import be.exe.auth.dto.request.ForgotPasswordRequest;
import be.exe.auth.dto.request.ResetPasswordRequest;
import be.exe.notification.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.web.util.HtmlUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

    private static final java.security.SecureRandom SECURE_RANDOM = new java.security.SecureRandom();

    @Value("${app.password-reset.frontend-reset-url:http://localhost:8081/reset-password}")
    private String passwordResetUrl = "http://localhost:8081/reset-password";

    @Value("${app.password-reset.expiration-minutes:30}")
    private long resetExpirationMinutes = 30;

    @Value("${app.otp.expiration-minutes:5}")
    private long otpExpirationMinutes = 5;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private long otpResendCooldownSeconds = 60;

    @Value("${app.otp.max-sends-per-hour:5}")
    private long otpMaxSendsPerHour = 5;

    @Value("${app.otp.max-verify-attempts:5}")
    private int otpMaxVerifyAttempts = 5;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           AuthenticationManager authenticationManager,
                           VerificationTokenRepository verificationTokenRepository,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
    }

    @Override
    public void sendRegisterOtp(SendOtpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // 1. Kiểm tra cooldown gửi lại OTP (vd 60s)
        var latestTokenOpt = verificationTokenRepository
                .findTopByEmailAndTypeOrderByCreatedAtDesc(request.getEmail(), VerificationTokenType.REGISTER_OTP);
        if (latestTokenOpt.isPresent()) {
            VerificationToken latest = latestTokenOpt.get();
            if (latest.getCreatedAt().plusSeconds(otpResendCooldownSeconds).isAfter(Instant.now())) {
                throw new BusinessException(
                        ErrorCode.OTP_RATE_LIMITED,
                        "Vui lòng đợi " + otpResendCooldownSeconds + " giây trước khi gửi lại mã OTP"
                );
            }
        }

        // 2. Kiểm tra giới hạn số lần gửi OTP trong 1 giờ
        Instant oneHourAgo = Instant.now().minusSeconds(3600);
        long sendsInLastHour = verificationTokenRepository
                .countByEmailAndTypeAndCreatedAtAfter(request.getEmail(), VerificationTokenType.REGISTER_OTP, oneHourAgo);
        if (sendsInLastHour >= otpMaxSendsPerHour) {
            throw new BusinessException(
                    ErrorCode.OTP_RATE_LIMITED,
                    "Bạn đã yêu cầu gửi mã OTP quá số lần cho phép trong 1 giờ. Vui lòng thử lại sau."
            );
        }

        // 3. Vô hiệu hóa toàn bộ OTP cũ chưa sử dụng của email này
        verificationTokenRepository.invalidateActiveTokens(request.getEmail(), VerificationTokenType.REGISTER_OTP);

        // 4. Sinh OTP ngẫu nhiên an toàn bằng SecureRandom (6 chữ số)
        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        VerificationToken token = new VerificationToken();
        token.setEmail(request.getEmail());
        token.setToken(otp);
        token.setType(VerificationTokenType.REGISTER_OTP);
        token.setExpiresAt(Instant.now().plusSeconds(otpExpirationMinutes * 60));

        verificationTokenRepository.save(token);

        // 5. Gửi email bất đồng bộ qua EmailService
        emailService.sendHtmlEmailAsync(
                request.getEmail(),
                "Mã OTP đăng ký tài khoản StyleLock",
                buildRegisterOtpEmail(otp),
                "Mã OTP StyleLock của bạn là: " + otp + ". Mã có hiệu lực trong vòng " + otpExpirationMinutes + " phút."
        );
    }

    @Override
    public void verifyRegisterOtp(VerifyOtpRequest request) {
        VerificationToken token = verificationTokenRepository
                .findTopByEmailAndTypeOrderByCreatedAtDesc(request.getEmail(), VerificationTokenType.REGISTER_OTP)
                .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_FAILED, "Không tìm thấy yêu cầu OTP cho email này"));

        if (token.isUsed()) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED, "Mã OTP đã hết hiệu lực hoặc đã được sử dụng");
        }

        if (token.getAttemptCount() >= otpMaxVerifyAttempts) {
            throw new BusinessException(ErrorCode.OTP_TOO_MANY_ATTEMPTS);
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(ErrorCode.OTP_EXPIRED);
        }

        if (!token.getToken().equals(request.getOtp())) {
            token.setAttemptCount(token.getAttemptCount() + 1);
            if (token.getAttemptCount() >= otpMaxVerifyAttempts) {
                token.setUsed(true); // Vô hiệu hóa mã khi đã nhập sai quá số lần quy định
                verificationTokenRepository.save(token);
                throw new BusinessException(ErrorCode.OTP_TOO_MANY_ATTEMPTS);
            }
            verificationTokenRepository.save(token);
            throw new BusinessException(ErrorCode.OTP_INVALID);
        }

        token.setVerified(true);
        verificationTokenRepository.save(token);
    }

    @Override
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        
        VerificationToken token = verificationTokenRepository
            .findTopByEmailAndTypeOrderByCreatedAtDesc(request.getEmail(), VerificationTokenType.REGISTER_OTP)
            .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_FAILED, "Email chưa được xác thực OTP"));
            
        if (!token.isVerified() || token.isUsed()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "OTP chưa được xác thực hoặc đã được sử dụng");
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

        token.setUsed(true);
        verificationTokenRepository.save(token);

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
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        refreshTokenRepository.revokeAllByUserId(userId);
        user.markDeleted(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        // Chống email enumeration: nếu email không tồn tại hoặc tài khoản đã bị xóa/khóa,
        // không ném lỗi ra ngoài mà kết thúc bình thường; client luôn nhận cùng thông báo thành công.
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || userOpt.get().isDeleted() || !userOpt.get().isEnabled()) {
            return;
        }

        User user = userOpt.get();

        // Vô hiệu hóa các reset token cũ chưa dùng
        verificationTokenRepository.invalidateActiveTokens(user.getEmail(), VerificationTokenType.RESET_PASSWORD);

        String resetToken = java.util.UUID.randomUUID().toString();

        VerificationToken token = new VerificationToken();
        token.setEmail(user.getEmail());
        token.setToken(resetToken);
        token.setType(VerificationTokenType.RESET_PASSWORD);
        token.setExpiresAt(Instant.now().plusSeconds(resetExpirationMinutes * 60));

        verificationTokenRepository.save(token);

        String resetLink = buildResetLink(resetToken);

        emailService.sendHtmlEmailAsync(
                user.getEmail(),
                "Xác minh yêu cầu đặt lại mật khẩu StyleLock",
                buildPasswordResetEmail(user.getFullName(), resetLink),
                "Vui lòng mở link sau để đặt lại mật khẩu StyleLock: "
                        + resetLink
                        + "\n\nĐường dẫn có hiệu lực trong vòng " + resetExpirationMinutes + " phút."
        );
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken token = verificationTokenRepository
                .findByTokenAndType(request.getToken(), VerificationTokenType.RESET_PASSWORD)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN, "Link đặt lại mật khẩu đã hết hạn");
        }

        if (token.isUsed()) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN, "Link đặt lại mật khẩu đã được sử dụng");
        }

        User user = userRepository.findByEmail(token.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_PASSWORD_RESET_TOKEN, "Người dùng không tồn tại"));

        user.changePassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        verificationTokenRepository.save(token);
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
    public UserResponse createSalonOwner(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        Role salonOwnerRole = roleRepository.findByName(RoleName.SALON_OWNER)
                .orElseThrow(() -> new IllegalStateException(
                        "Role SALON_OWNER chưa được seed trong DB - kiểm tra lại migration V1"));

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName());
        user.setPhone(request.getPhone());
        user.addRole(salonOwnerRole);
        userRepository.save(user);

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

    private String buildResetLink(String resetToken) {
        String separator = passwordResetUrl.contains("?") ? "&" : "?";
        return passwordResetUrl
                + separator
                + "token="
                + URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
    }

    private String buildRegisterOtpEmail(String otp) {
        String safeOtp = HtmlUtils.htmlEscape(otp);
        return buildAuthEmailTemplate(
                "StyleLock Account Verification",
                "Xác minh email của bạn",
                "<p style=\"margin:0 0 18px;color:#6f6255;font-size:15px;line-height:24px;\">"
                        + "Nhập mã OTP dưới đây trên màn hình đăng ký StyleLock để hoàn tất tạo tài khoản."
                        + "</p>"
                        + "<div style=\"margin:24px 0;padding:18px 20px;border-radius:16px;background:#f7efe4;border:1px solid #ddcbb5;text-align:center;\">"
                        + "<div style=\"font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9b8b7a;font-weight:700;margin-bottom:8px;\">Verification Code</div>"
                        + "<div style=\"font-size:34px;letter-spacing:8px;color:#6B4227;font-weight:800;font-family:Arial,sans-serif;\">"
                        + safeOtp
                        + "</div>"
                        + "</div>"
                        + "<p style=\"margin:0;color:#8a857d;font-size:13px;line-height:21px;\">"
                        + "Mã có hiệu lực trong " + otpExpirationMinutes + " phút. Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này."
                        + "</p>"
        );
    }

    private String buildPasswordResetEmail(String fullName, String resetLink) {
        String safeName = HtmlUtils.htmlEscape(
                fullName == null || fullName.isBlank() ? "bạn" : fullName
        );
        String safeResetLink = HtmlUtils.htmlEscape(resetLink);
        return buildAuthEmailTemplate(
                "StyleLock Password Reset",
                "Xác minh yêu cầu đổi mật khẩu",
                "<p style=\"margin:0 0 14px;color:#6f6255;font-size:15px;line-height:24px;\">"
                        + "Xin chào " + safeName + ","
                        + "</p>"
                        + "<p style=\"margin:0 0 24px;color:#6f6255;font-size:15px;line-height:24px;\">"
                        + "StyleLock vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. "
                        + "Nhấn nút bên dưới để xác minh và tạo mật khẩu mới."
                        + "</p>"
                        + "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:28px auto;\">"
                        + "<tr>"
                        + "<td style=\"border-radius:16px;background:#EFE6D8;text-align:center;border:1px solid #ddcbb5;\">"
                        + "<a href=\"" + safeResetLink + "\" target=\"_blank\" "
                        + "style=\"display:inline-block;padding:15px 34px;border-radius:16px;color:#1f1713;text-decoration:none;font-size:15px;font-weight:800;font-family:Segoe UI,Arial,sans-serif;\">"
                        + "Verify"
                        + "</a>"
                        + "</td>"
                        + "</tr>"
                        + "</table>"
                        + "<p style=\"margin:0;color:#8a857d;font-size:13px;line-height:21px;\">"
                        + "Nút Verify có hiệu lực trong " + resetExpirationMinutes + " phút. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này."
                        + "</p>"
        );
    }

    private String buildAuthEmailTemplate(String eyebrow, String title, String contentHtml) {
        return "<!doctype html>"
                + "<html>"
                + "<body style=\"margin:0;padding:0;background:#f5f5f3;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#241f1a;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background:#f5f5f3;padding:28px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"max-width:520px;background:#ffffff;border-radius:26px;overflow:hidden;border:1px solid #e5d9ca;box-shadow:0 18px 48px rgba(47,35,24,0.12);\">"
                + "<tr>"
                + "<td style=\"padding:28px 28px 18px;background:#ffffff;text-align:center;\">"
                + "<img src=\"cid:stylelock-logo\" alt=\"StyleLock\" width=\"180\" "
                + "style=\"display:block;margin:0 auto 14px;width:180px;max-width:78%;height:auto;\"/>"
                + "<div style=\"font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9a7652;font-weight:800;margin-bottom:8px;\">"
                + HtmlUtils.htmlEscape(eyebrow)
                + "</div>"
                + "<h1 style=\"margin:0;color:#241f1a;font-size:24px;line-height:31px;font-weight:700;font-family:Segoe UI,Roboto,Arial,sans-serif;letter-spacing:0;\">"
                + HtmlUtils.htmlEscape(title)
                + "</h1>"
                + "</td>"
                + "</tr>"
                + "<tr><td style=\"padding:30px 30px 24px;\">"
                + contentHtml
                + "</td></tr>"
                + "<tr>"
                + "<td style=\"padding:18px 30px 28px;border-top:1px solid #eee5da;color:#8a857d;font-size:12px;line-height:19px;text-align:center;\">"
                + "StyleLock gửi email này để bảo vệ tài khoản và lịch hẹn salon của bạn."
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

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
