package be.exe.common.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind config app.jwt.* trong application.yml vào object Java.
 * Cần thêm @ConfigurationPropertiesScan hoặc @EnableConfigurationProperties(JwtProperties.class)
 * ở class Application chính để Spring nhận diện.
 */
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * Secret key ký JWT - PHẢI là chuỗi đủ dài (>= 256 bit / 32 ký tự) cho thuật toán HS256.
     */
    private String secret;

    private long accessTokenExpirationMs;

    private long refreshTokenExpirationMs;

    private String issuer;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }

    public void setAccessTokenExpirationMs(long accessTokenExpirationMs) {
        this.accessTokenExpirationMs = accessTokenExpirationMs;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    public void setRefreshTokenExpirationMs(long refreshTokenExpirationMs) {
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
}
