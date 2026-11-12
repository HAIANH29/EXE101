package be.exe.booking.service.impl;

import be.exe.booking.domain.Booking;
import be.exe.booking.domain.BookingStatus;
import be.exe.booking.domain.event.BookingReminderEvent;
import be.exe.booking.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Nhắc lịch hẹn đã được xác nhận ở hai mốc: ~5 tiếng trước (báo "hôm nay bạn có lịch") và
 * ~1 tiếng trước. Job chạy mỗi 5 phút. Mỗi mốc là một khoảng thời gian chứ không phải một điểm,
 * và có cờ đã-nhắc riêng, nên job bị lỡ nhịp (vd. server free tier ngủ) vẫn nhắc bù ngay khi dậy
 * mà không gửi trùng:
 * - mốc 5h: giờ hẹn còn trong (2h, 5h5p];
 * - mốc 1h: giờ hẹn còn trong (0, 1h5p]. Gửi mốc 1h sẽ đánh dấu luôn mốc 5h là đã nhắc.
 */
@Service
public class BookingReminderService {

    private static final Logger log = LoggerFactory.getLogger(BookingReminderService.class);

    private static final Duration SLACK = Duration.ofMinutes(5);
    private static final Duration FIVE_HOURS = Duration.ofHours(5);
    private static final Duration TWO_HOURS = Duration.ofHours(2);
    private static final Duration ONE_HOUR = Duration.ofHours(1);

    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public BookingReminderService(BookingRepository bookingRepository, ApplicationEventPublisher eventPublisher) {
        this.bookingRepository = bookingRepository;
        this.eventPublisher = eventPublisher;
    }

    @Scheduled(fixedRateString = "${app.booking.reminder.rate:300000}") // mặc định 5 phút
    @Transactional
    public void sendBookingReminders() {
        remindAt(Instant.now());
    }

    /** Tách ra để test được với thời điểm "bây giờ" tùy ý. */
    @Transactional
    public int remindAt(Instant now) {
        int count = 0;

        // Mốc 1h xử lý trước: booking vừa lọt vào cửa sổ 1h sẽ không bị nhắc thêm mốc 5h.
        for (Booking booking : bookingRepository.findDueFor1hReminder(
                BookingStatus.CONFIRMED, now, now.plus(ONE_HOUR).plus(SLACK))) {
            booking.markReminded1h();
            count += publish(booking, 1);
        }

        for (Booking booking : bookingRepository.findDueFor5hReminder(
                BookingStatus.CONFIRMED, now.plus(TWO_HOURS), now.plus(FIVE_HOURS).plus(SLACK))) {
            booking.markReminded5h();
            count += publish(booking, 5);
        }

        log.info("Hoàn tất job nhắc lịch hẹn. Đã nhắc {} lần.", count);
        return count;
    }

    private int publish(Booking booking, int hoursBefore) {
        try {
            bookingRepository.save(booking);
            eventPublisher.publishEvent(new BookingReminderEvent(
                    booking.getId(), booking.getCustomerId(), booking.getStartAt(), hoursBefore));
            return 1;
        } catch (Exception e) {
            log.error("Lỗi khi gửi thông báo nhắc lịch ({}h) cho booking {}", hoursBefore, booking.getId(), e);
            return 0;
        }
    }
}
