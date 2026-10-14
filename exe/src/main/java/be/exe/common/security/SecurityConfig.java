package be.exe.common.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;

import jakarta.servlet.http.HttpServletResponse;

import be.exe.common.audit.AuditFilter;

/**
 * Cấu hình Spring Security tổng thể:
 * - Stateless (không dùng session, mọi request xác thực qua JWT)
 * - Public endpoint: login/register/reset password, /api/public/**, Swagger, webhook SePay, uploaded files
 * - Còn lại: bắt buộc phải có JWT hợp lệ
 *
 * GHI CHÚ VỀ GOOGLE LOGIN: không dùng oauth2Login() của Spring Security (redirect-based,
 * cần success/failure handler phức tạp, từng gây circular dependency). Thay vào đó, frontend
 * tự xử lý nút "Đăng nhập Google" bằng Google Identity Services SDK, lấy ID token, gửi lên
 * endpoint POST /api/auth/google (xem AuthController + GoogleTokenVerifier ở module auth)
 * - đơn giản hơn nhiều, vẫn đúng chuẩn bảo mật Google khuyến nghị cho SPA/mobile app.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuditFilter auditFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, AuditFilter auditFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.auditFilter = auditFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public - không cần đăng nhập
                        .requestMatchers(
                                "/api/public/**",
                                "/api/payment/webhook/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/v3/api-docs/**",
                                "/uploads/**",
                                "/images/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/register/send-otp",
                                "/api/auth/register/verify-otp",
                                "/api/auth/login",
                                "/api/auth/google",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/salons",
                                "/api/salons/**",
                                "/api/catalog/**",
                                "/api/services/**",
                                "/api/stylists/**"
                        ).permitAll()
                        // Còn lại bắt buộc phải đăng nhập
                        .anyRequest().authenticated()
                )
                    .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(auditFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * BCrypt cho mật khẩu người dùng - KHÔNG dùng SHA-256/HashUtils cho mật khẩu,
     * vì BCrypt có salt tự động và chi phí tính toán cao hơn nhiều, chống brute-force tốt hơn.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            CustomUserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}
