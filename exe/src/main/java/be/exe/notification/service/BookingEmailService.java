package be.exe.notification.service;

import be.exe.booking.dto.response.BookingResponse;
import be.exe.booking.service.BookingService;
import be.exe.common.security.UserAccountPort;
import be.exe.notification.mail.BookingEmailTemplates;
import be.exe.notification.mail.BookingEmailTemplates.BookingInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

/**
 * Gửi email về lịch hẹn tới Gmail của khách (đặt lịch, xác nhận, nhắc 5 tiếng, nhắc 1 tiếng).
 * Email chỉ là kênh bổ sung cho thông báo trên chuông: mọi lỗi (mail tắt, thiếu cấu hình, khách không có
 * email...) chỉ được ghi log và KHÔNG được làm hỏng luồng đặt lịch hay làm mất thông báo trong app.
 */
@Service
public class BookingEmailService {

    private static final Logger log = LoggerFactory.getLogger(BookingEmailService.class);

    private final EmailService emailService;
    private final BookingService bookingService;
    private final UserAccountPort userAccountPort;
    private final String publicBaseUrl;

    public BookingEmailService(EmailService emailService,
                               BookingService bookingService,
                               UserAccountPort userAccountPort,
                               @Value("${app.upload.public-base-url:http://localhost:8080}") String publicBaseUrl) {
        this.emailService = emailService;
        this.bookingService = bookingService;
        this.userAccountPort = userAccountPort;
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
    }

    public void sendBookingCreated(Long bookingId) {
        send(bookingId, "Đặt lịch thành công - StyleLock", (info, url) ->
                new Mail(BookingEmailTemplates.created(info),
                        BookingEmailTemplates.plainText("Đặt lịch thành công. Vui lòng hoàn tất thanh toán.", info)));
    }

    public void sendBookingConfirmed(Long bookingId) {
        send(bookingId, "Lịch hẹn của bạn đã được xác nhận - StyleLock", (info, url) ->
                new Mail(BookingEmailTemplates.confirmed(info, url),
                        BookingEmailTemplates.plainText("Salon đã xác nhận lịch hẹn của bạn.", info)));
    }

    public void sendReminder(Long bookingId, int hoursBefore, boolean confirmed) {
        if (hoursBefore <= 1) {
            send(bookingId, "Lịch cắt tóc của bạn diễn ra trong 1 tiếng nữa", (info, url) ->
                    new Mail(BookingEmailTemplates.reminder1h(info, url, confirmed),
                            BookingEmailTemplates.plainText("Lịch cắt tóc của bạn diễn ra trong 1 tiếng nữa.", info)));
        } else {
            send(bookingId, null, (info, url) ->
                    new Mail(BookingEmailTemplates.reminder5h(info, url, confirmed),
                            BookingEmailTemplates.plainText("Hôm nay bạn có lịch cắt tóc.", info)),
                    info -> "Hôm nay bạn có lịch cắt tóc lúc " + BookingEmailTemplates.hhmm(info.startAt()));
        }
    }

    private record Mail(String html, String text) {
    }

    private interface MailBuilder {
        Mail build(BookingInfo info, String countdownUrl);
    }

    private interface SubjectBuilder {
        String build(BookingInfo info);
    }

    private void send(Long bookingId, String subject, MailBuilder builder) {
        send(bookingId, subject, builder, null);
    }

    private void send(Long bookingId, String fixedSubject, MailBuilder builder, SubjectBuilder subjectBuilder) {
        try {
            BookingResponse booking = bookingService.getBookingForNotification(bookingId);
            Optional<UserAccountPort.PublicProfile> customer =
                    userAccountPort.findPublicProfileById(booking.customerId());
            if (customer.isEmpty() || customer.get().email() == null || customer.get().email().isBlank()) {
                log.warn("Bỏ qua email booking {}: khách hàng không có email", bookingId);
                return;
            }

            BookingInfo info = new BookingInfo(
                    customer.get().fullName(), booking.salonName(), booking.salonAddress(),
                    booking.serviceName(), booking.stylistName(), booking.startAt());
            Mail mail = builder.build(info, countdownUrl(booking.startAt()));
            String subject = fixedSubject != null ? fixedSubject : subjectBuilder.build(info);

            emailService.sendHtmlEmailAsync(customer.get().email(), subject, mail.html(), mail.text());
        } catch (Exception e) {
            log.warn("Không gửi được email booking {}: {}", bookingId, e.toString());
        }
    }

    private String countdownUrl(Instant startAt) {
        return publicBaseUrl + "/api/public/email/countdown.gif?to=" + startAt.getEpochSecond();
    }
}
