package be.exe.auth.controller;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

/**
 * Trang trung gian cho link quên mật khẩu: Gmail chỉ cho bấm link http(s), nên email trỏ về
 * đây và trang này mở app StyleLock qua deep link (stylelock://reset-password?token=...).
 */
@RestController
public class PasswordResetRedirectController {

    private static final String APP_SCHEME = "stylelock";
    private static final String ANDROID_PACKAGE = "com.stylelock.app";

    @GetMapping(value = "/reset-password", produces = MediaType.TEXT_HTML_VALUE)
    public String openApp(@RequestParam(defaultValue = "") String token) {
        String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String appLink = APP_SCHEME + "://reset-password?token=" + encoded;
        String intentLink = "intent://reset-password?token=" + encoded
                + "#Intent;scheme=" + APP_SCHEME + ";package=" + ANDROID_PACKAGE + ";end";
        String safeAppLink = HtmlUtils.htmlEscape(appLink);
        String safeIntentLink = HtmlUtils.htmlEscape(intentLink);

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Đặt lại mật khẩu - StyleLock</title>
                  <style>
                    body{font-family:sans-serif;text-align:center;padding:48px 24px;color:#222}
                    a.btn{display:inline-block;margin-top:24px;padding:14px 28px;background:#111;
                          color:#fff;border-radius:999px;text-decoration:none;font-weight:600}
                  </style>
                </head>
                <body>
                  <h2>Đặt lại mật khẩu StyleLock</h2>
                  <p>Đang mở ứng dụng StyleLock...</p>
                  <a class="btn" href="%s">Mở ứng dụng StyleLock</a>
                  <p style="margin-top:32px;color:#777;font-size:14px">
                    Nếu ứng dụng không tự mở, hãy chắc chắn bạn đã cài StyleLock rồi bấm nút trên.
                  </p>
                  <script>
                    var isAndroid = /android/i.test(navigator.userAgent);
                    window.location.href = isAndroid ? "%s" : "%s";
                  </script>
                </body>
                </html>
                """.formatted(safeAppLink, safeIntentLink.replace("\\", "\\\\"), safeAppLink);
    }
}
