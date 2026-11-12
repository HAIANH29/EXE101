package be.exe.analytics.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VisitRateLimiterTest {

    @Test
    void blocksAfterLimitAndResetsNextWindow() {
        VisitRateLimiter limiter = new VisitRateLimiter();
        long t0 = 1_000_000L;

        for (int i = 0; i < VisitRateLimiter.MAX_PER_WINDOW; i++) {
            assertTrue(limiter.tryAcquire("1.1.1.1", t0 + i));
        }
        assertFalse(limiter.tryAcquire("1.1.1.1", t0 + 100));
        assertTrue(limiter.tryAcquire("2.2.2.2", t0 + 100), "IP khác không bị ảnh hưởng");
        assertTrue(limiter.tryAcquire("1.1.1.1", t0 + 60_001), "sang cửa sổ mới thì được lại");
    }
}
