package be.exe.notification.countdown;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Ảnh đồng hồ đếm ngược nhúng trong email nhắc lịch. Public (email client tải ảnh không có token).
 * Ảnh chỉ chứa con số đếm ngược tới mốc `to`, không có dữ liệu cá nhân.
 */
@RestController
@RequestMapping("/api/public/email")
public class CountdownImageController {

    private static final long MAX_PAST_SECONDS = 24 * 3600L;
    private static final long MAX_FUTURE_SECONDS = 60L * 24 * 3600L;
    private static final long BUCKET_SECONDS = 5;
    private static final int CACHE_SIZE = 64;

    /** Cache nhỏ theo (mốc đích, bucket 5 giây) để một đợt mở thư hàng loạt không phải vẽ lại liên tục. */
    private final Map<String, byte[]> cache = new LinkedHashMap<>(CACHE_SIZE, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
            return size() > CACHE_SIZE;
        }
    };

    @GetMapping(value = "/countdown.gif", produces = "image/gif")
    public ResponseEntity<byte[]> countdown(@RequestParam("to") long targetEpochSeconds) {
        long now = Instant.now().getEpochSecond();
        if (targetEpochSeconds < now - MAX_PAST_SECONDS || targetEpochSeconds > now + MAX_FUTURE_SECONDS) {
            return ResponseEntity.badRequest().build();
        }

        String key = targetEpochSeconds + ":" + (now / BUCKET_SECONDS);
        byte[] body;
        synchronized (cache) {
            body = cache.get(key);
        }
        if (body == null) {
            body = CountdownGifRenderer.render(targetEpochSeconds - now);
            synchronized (cache) {
                cache.put(key, body);
            }
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("image/gif"))
                .cacheControl(CacheControl.noStore())
                .body(body);
    }
}
