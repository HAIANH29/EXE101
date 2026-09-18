package be.exe.common.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Tiện ích hash dùng cho refresh token (SHA-256) và verify chữ ký webhook (HMAC-SHA256, ví dụ SePay).
 * Không dùng cho hash mật khẩu người dùng — mật khẩu phải dùng BCrypt (PasswordEncoder của Spring Security).
 */
public final class HashUtils {

    private HashUtils() {
    }

    /**
     * SHA-256 một chiều, dùng để lưu refresh token trong DB (không lưu token thô).
     */
    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Tạo chữ ký HMAC-SHA256, dùng để verify webhook từ SePay
     * (so sánh signature SePay gửi kèm request với signature tự tính ra từ secret).
     */
    public static String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 computation failed", e);
        }
    }

    /**
     * So sánh 2 chuỗi theo thời gian không đổi (constant-time), tránh timing attack
     * khi verify signature webhook.
     */
    public static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8)
        );
    }
}
