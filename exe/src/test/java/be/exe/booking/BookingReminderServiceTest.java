package be.exe.booking;

import be.exe.booking.domain.Booking;
import be.exe.booking.domain.event.BookingReminderEvent;
import be.exe.booking.repository.BookingRepository;
import be.exe.booking.service.impl.BookingReminderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@RecordApplicationEvents
class BookingReminderServiceTest {

    @Autowired
    private BookingReminderService reminderService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ApplicationEvents events;

    private List<BookingReminderEvent> remindersFor(Long customerId) {
        return events.stream(BookingReminderEvent.class)
                .filter(e -> e.customerId().equals(customerId))
                .toList();
    }

    private Booking confirmedBooking(Long customerId, Instant startAt) {
        Booking booking = new Booking(customerId, 1L, 1L, 1L, null, startAt,
                startAt.plusSeconds(3600), new BigDecimal("100000"), null);
        booking.confirm();
        return bookingRepository.save(booking);
    }

    @Test
    void remindsOnceAroundFiveHoursBefore() {
        Instant now = Instant.now();
        confirmedBooking(9101L, now.plus(Duration.ofHours(4)).plus(Duration.ofMinutes(50)));

        reminderService.remindAt(now);
        reminderService.remindAt(now.plusSeconds(300)); // lần quét sau không được gửi trùng

        List<BookingReminderEvent> sent = remindersFor(9101L);
        assertEquals(1, sent.size());
        assertEquals(5, sent.get(0).hoursBefore());
    }

    @Test
    void remindsOneHourBeforeAndThatSupersedesTheFiveHourReminder() {
        Instant now = Instant.now();
        confirmedBooking(9102L, now.plus(Duration.ofMinutes(58)));

        reminderService.remindAt(now);
        reminderService.remindAt(now.plusSeconds(300));

        List<BookingReminderEvent> sent = remindersFor(9102L);
        assertEquals(1, sent.size());
        assertEquals(1, sent.get(0).hoursBefore());
    }

    @Test
    void sendsBothRemindersAsTimePasses() {
        Instant start = Instant.now().plus(Duration.ofHours(5));
        confirmedBooking(9103L, start);

        reminderService.remindAt(start.minus(Duration.ofHours(5)));   // còn 5h
        reminderService.remindAt(start.minus(Duration.ofMinutes(60))); // còn 1h

        List<BookingReminderEvent> sent = remindersFor(9103L);
        assertEquals(List.of(5, 1), sent.stream().map(BookingReminderEvent::hoursBefore).toList());
    }

    @Test
    void remindsUnpaidPendingBookingsAndFlagsThemAsNotConfirmed() {
        Instant now = Instant.now();
        Booking pending = new Booking(9104L, 1L, 1L, 1L, null, now.plus(Duration.ofMinutes(11)),
                now.plus(Duration.ofHours(1)), new BigDecimal("100000"), null);
        bookingRepository.save(pending);
        confirmedBooking(9107L, now.plus(Duration.ofMinutes(11)));

        reminderService.remindAt(now);

        List<BookingReminderEvent> unpaid = remindersFor(9104L);
        assertEquals(1, unpaid.size());
        assertEquals(1, unpaid.get(0).hoursBefore());
        assertTrue(!unpaid.get(0).confirmed());
        assertTrue(remindersFor(9107L).get(0).confirmed());
    }

    @Test
    void ignoresCancelledFarAwayAndAlreadyStartedBookings() {
        Instant now = Instant.now();
        Booking cancelled = new Booking(9108L, 1L, 1L, 1L, null, now.plus(Duration.ofMinutes(30)),
                now.plus(Duration.ofHours(1)), new BigDecimal("100000"), null);
        cancelled.cancel();
        bookingRepository.save(cancelled);
        confirmedBooking(9105L, now.plus(Duration.ofHours(9)));               // còn quá xa
        confirmedBooking(9106L, now.minus(Duration.ofMinutes(10)));           // đã bắt đầu

        reminderService.remindAt(now);

        assertTrue(remindersFor(9108L).isEmpty());
        assertTrue(remindersFor(9105L).isEmpty());
        assertTrue(remindersFor(9106L).isEmpty());
    }
}
