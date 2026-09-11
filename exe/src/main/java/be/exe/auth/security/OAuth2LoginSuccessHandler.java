package be.exe.auth.security;

import be.exe.auth.dto.response.LoginResponse;
import be.exe.auth.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String redirectUri;

    public OAuth2LoginSuccessHandler(@Lazy AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String fullName = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");

        if (email == null || Boolean.FALSE.equals(emailVerified)) {
            response.sendRedirect(redirectUri + "?error=" +
                    URLEncoder.encode("Email Google chưa được xác minh", StandardCharsets.UTF_8));
            return;
        }

        LoginResponse loginResponse = authService.loginOrRegisterViaOAuth2(email, fullName, avatarUrl);

        String targetUrl = redirectUri + "#access_token=" +
                URLEncoder.encode(loginResponse.getAccessToken(), StandardCharsets.UTF_8) +
                "&refresh_token=" +
                URLEncoder.encode(loginResponse.getRefreshToken(), StandardCharsets.UTF_8) +
                "&expires_in=" + loginResponse.getExpiresIn();

        response.sendRedirect(targetUrl);
    }
}