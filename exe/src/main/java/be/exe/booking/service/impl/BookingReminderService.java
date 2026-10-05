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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BookingReminderService {

    private static final Logger log = LoggerFactory.getLogger(BookingReminderService.class);
    
    // Nhắc lịch trước 2 tiếng
    private static final int REMINDER_HOURS = 2;

    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;

    public BookingReminderService(BookingRepository bookingRepository, ApplicationEventPublisher eventPublisher) {
        this.bookingRepository = bookingRepository;
        this.eventPublisher = eventPublisher;
    }

    @Scheduled(fixedRateString = "${app.booking.reminder.rate:300000}") // Default: 5 minutes
    @Transactional
    public void sendBookingReminders() {
        log.info("Bắt đầu chạy job nhắc lịch hẹn...");
        
        Instant now = Instant.now();
        Instant endWindow = now.plus(REMINDER_HOURS, ChronoUnit.HOURS).plus(5, ChronoUnit.MINUTES);
        Instant startWindow = now.plus(REMINDER_HOURS, ChronoUnit.HOURS).minus(10, ChronoUnit.MINUTES);
        
        List<BookingStatus> statuses = List.of(BookingStatus.CONFIRMED);
        
        // Find bookings in the window that haven't been reminded
        List<Booking> bookingsToRemind = bookingRepository.findByStatusInAndRemindedFalseAndStartAtBetween(
                statuses, startWindow, endWindow
        );
        
        int count = 0;
        for (Booking booking : bookingsToRemind) {
            try {
                booking.markReminded();
                bookingRepository.save(booking); // Need to save before publishing event to avoid race conditions if notification is in REQUIRES_NEW but transaction not committed yet, though event publisher is AFTER_COMMIT so it should be fine. Actually we don't need to save explicitly in @Transactional if entity is managed, but let's be safe.
                
                eventPublisher.publishEvent(new BookingReminderEvent(
                        booking.getId(),
                        booking.getCustomerId(),
                        booking.getStartAt()
                ));
                count++;
            } catch (Exception e) {
                log.error("Lỗi khi gửi thông báo nhắc lịch cho booking {}", booking.getId(), e);
            }
        }
        
        log.info("Hoàn tất job nhắc lịch hẹn. Đã nhắc {} lịch hẹn.", count);
    }
}
