package be.exe.auth.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private String redirectUri;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                         AuthenticationException exception) throws IOException, ServletException {

        String targetUrl = redirectUri + "?error=" +
                URLEncoder.encode("Đăng nhập Google thất bại, vui lòng thử lại", StandardCharsets.UTF_8);

        response.sendRedirect(targetUrl);
    }
}
