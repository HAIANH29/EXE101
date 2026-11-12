package be.exe.analytics.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Giới hạn tốc độ đơn giản trong bộ nhớ cho endpoint ghi nhận truy cập công khai:
 * tối đa {@link #MAX_PER_WINDOW} lượt / IP / phút. Đủ để chặn spam thô cho MVP chạy một instance.
 */
@Component
public class VisitRateLimiter {

    static final int MAX_PER_WINDOW = 20;
    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_TRACKED_KEYS = 10_000;

    private record Window(long startMs, int count) {
    }

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key) {
        return tryAcquire(key, System.currentTimeMillis());
    }

    boolean tryAcquire(String key, long nowMs) {
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.entrySet().removeIf(e -> nowMs - e.getValue().startMs() >= WINDOW_MS);
        }
        boolean[] allowed = {false};
        windows.compute(key, (k, current) -> {
            if (current == null || nowMs - current.startMs() >= WINDOW_MS) {
                allowed[0] = true;
                return new Window(nowMs, 1);
            }
            if (current.count() < MAX_PER_WINDOW) {
                allowed[0] = true;
                return new Window(current.startMs(), current.count() + 1);
            }
            return current;
        });
        return allowed[0];
    }
}
