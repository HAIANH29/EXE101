package be.exe.notification.mail;

import org.springframework.web.util.HtmlUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Giao diện email về lịch hẹn, cùng phong cách với email OTP / quên mật khẩu
 * (khung be, logo StyleLock qua cid:stylelock-logo). Chỉ dùng bảng + style inline để Gmail hiển thị đúng.
 */
public final class BookingEmailTemplates {

    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm").withZone(VN);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(VN);

    private BookingEmailTemplates() {
    }

    /** Thông tin cần hiển thị. */
    public record BookingInfo(String customerName, String salonName, String salonAddress,
                              String serviceName, String stylistName, Instant startAt) {
    }

    public static String hhmm(Instant instant) {
        return TIME.format(instant);
    }

    public static String created(BookingInfo b) {
        return layout("StyleLock Booking", "Đặt lịch thành công",
                greeting(b) + paragraph("StyleLock đã ghi nhận lịch hẹn của bạn. Vui lòng hoàn tất thanh toán "
                        + "để salon xác nhận lịch.")
                        + details(b)
                        + note("Chúng tôi sẽ nhắc bạn trước giờ hẹn khoảng 5 tiếng và 1 tiếng."));
    }

    public static String confirmed(BookingInfo b, String countdownUrl) {
        return layout("StyleLock Booking", "Lịch hẹn đã được xác nhận",
                greeting(b) + paragraph("Salon đã xác nhận lịch hẹn của bạn. Hẹn gặp bạn đúng giờ nhé!")
                        + details(b)
                        + countdown(countdownUrl, "Còn lại đến giờ hẹn")
                        + note("Chúng tôi sẽ nhắc bạn trước giờ hẹn khoảng 5 tiếng và 1 tiếng."));
    }

    public static String reminder5h(BookingInfo b, String countdownUrl, boolean confirmed) {
        return layout("StyleLock Reminder", "Hôm nay bạn có lịch cắt tóc",
                greeting(b) + paragraph("Hôm nay bạn có lịch hẹn lúc <b>" + TIME.format(b.startAt())
                        + "</b>. Hãy sắp xếp thời gian để đến đúng giờ nhé.")
                        + details(b)
                        + unpaidWarning(confirmed)
                        + countdown(countdownUrl, "Còn lại đến giờ hẹn"));
    }

    public static String reminder1h(BookingInfo b, String countdownUrl, boolean confirmed) {
        return layout("StyleLock Reminder", "Lịch cắt tóc diễn ra trong 1 tiếng nữa",
                greeting(b) + paragraph("Lịch hẹn của bạn bắt đầu lúc <b>" + TIME.format(b.startAt())
                        + "</b>, chỉ còn khoảng 1 tiếng nữa. Bạn nên xuất phát sớm để kịp giờ.")
                        + details(b)
                        + unpaidWarning(confirmed)
                        + countdown(countdownUrl, "Còn lại đến giờ hẹn"));
    }

    private static String unpaidWarning(boolean confirmed) {
        if (confirmed) {
            return "";
        }
        return "<p style=\"margin:16px 0 0;padding:12px 14px;border-radius:12px;background:#fbe7e1;color:#8a3b2c;"
                + "font-size:14px;line-height:21px;font-weight:600;\">Lịch hẹn này chưa được thanh toán. "
                + "Hãy hoàn tất thanh toán trong app StyleLock để giữ lịch.</p>";
    }

    /** Bản text thuần cho email client không hiển thị HTML. */
    public static String plainText(String headline, BookingInfo b) {
        return headline + "\n"
                + "Salon: " + b.salonName() + "\n"
                + (isBlank(b.salonAddress()) ? "" : "Địa chỉ: " + b.salonAddress() + "\n")
                + "Dịch vụ: " + b.serviceName() + "\n"
                + "Thời gian: " + TIME.format(b.startAt()) + " ngày " + DATE.format(b.startAt()) + "\n";
    }

    private static String greeting(BookingInfo b) {
        String name = isBlank(b.customerName()) ? "bạn" : b.customerName();
        return "<p style=\"margin:0 0 14px;color:#6f6255;font-size:15px;line-height:24px;\">Xin chào "
                + esc(name) + ",</p>";
    }

    private static String paragraph(String html) {
        return "<p style=\"margin:0 0 20px;color:#6f6255;font-size:15px;line-height:24px;\">" + html + "</p>";
    }

    private static String note(String text) {
        return "<p style=\"margin:22px 0 0;color:#8a857d;font-size:13px;line-height:21px;\">" + esc(text) + "</p>";
    }

    private static String details(BookingInfo b) {
        StringBuilder rows = new StringBuilder();
        rows.append(row("Thời gian", TIME.format(b.startAt()) + " · " + DATE.format(b.startAt())));
        rows.append(row("Salon", b.salonName()));
        if (!isBlank(b.salonAddress())) {
            rows.append(row("Địa chỉ", b.salonAddress()));
        }
        rows.append(row("Dịch vụ", b.serviceName()));
        if (!isBlank(b.stylistName())) {
            rows.append(row("Stylist", b.stylistName()));
        }
        return "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" "
                + "style=\"margin:0 0 8px;padding:6px 18px;border-radius:16px;background:#f7efe4;border:1px solid #ddcbb5;\">"
                + rows + "</table>";
    }

    private static String row(String label, String value) {
        return "<tr>"
                + "<td style=\"padding:9px 0;width:84px;color:#9b8b7a;font-size:12px;letter-spacing:1px;"
                + "text-transform:uppercase;font-weight:700;vertical-align:top;\">" + esc(label) + "</td>"
                + "<td style=\"padding:9px 0;color:#241f1a;font-size:15px;font-weight:600;line-height:22px;\">"
                + esc(value == null ? "" : value) + "</td></tr>";
    }

    /** Đồng hồ đếm ngược: ảnh GIF động do backend vẽ khi mở thư (email không chạy được JavaScript). */
    private static String countdown(String imageUrl, String caption) {
        return "<div style=\"margin:22px 0 0;text-align:center;\">"
                + "<div style=\"font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#9b8b7a;"
                + "font-weight:700;margin-bottom:10px;\">" + esc(caption) + "</div>"
                + "<img src=\"" + esc(imageUrl) + "\" alt=\"Đồng hồ đếm ngược\" width=\"420\" "
                + "style=\"display:block;margin:0 auto;width:100%;max-width:420px;height:auto;border-radius:16px;\"/>"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" "
                + "style=\"max-width:420px;margin:6px auto 0;\"><tr>"
                + label("Giờ") + label("Phút") + label("Giây")
                + "</tr></table></div>";
    }

    private static String label(String text) {
        return "<td align=\"center\" style=\"width:33%;color:#9a7652;font-size:12px;font-weight:700;\">"
                + text + "</td>";
    }

    private static String layout(String eyebrow, String title, String contentHtml) {
        return "<!doctype html>"
                + "<html>"
                + "<body style=\"margin:0;padding:0;background:#f5f5f3;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#241f1a;\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background:#f5f5f3;padding:28px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"max-width:520px;background:#ffffff;border-radius:26px;overflow:hidden;border:1px solid #e5d9ca;box-shadow:0 18px 48px rgba(47,35,24,0.12);\">"
                + "<tr>"
                + "<td style=\"padding:28px 28px 18px;background:#efe6d8;text-align:center;\">"
                + "<img src=\"cid:" + OutgoingEmail.LOGO_CID + "\" alt=\"StyleLock\" width=\"180\" "
                + "style=\"display:block;margin:0 auto 14px;width:180px;max-width:78%;height:auto;\"/>"
                + "<div style=\"font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9a7652;font-weight:800;margin-bottom:8px;\">"
                + esc(eyebrow)
                + "</div>"
                + "<h1 style=\"margin:0;color:#241f1a;font-size:24px;line-height:31px;font-weight:700;font-family:Segoe UI,Roboto,Arial,sans-serif;letter-spacing:0;\">"
                + esc(title)
                + "</h1>"
                + "</td>"
                + "</tr>"
                + "<tr><td style=\"padding:30px 30px 24px;\">"
                + contentHtml
                + "</td></tr>"
                + "<tr>"
                + "<td style=\"padding:18px 30px 28px;border-top:1px solid #eee5da;color:#8a857d;font-size:12px;line-height:19px;text-align:center;\">"
                + "StyleLock gửi email này để nhắc bạn về lịch hẹn salon."
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

    private static String esc(String s) {
        return HtmlUtils.htmlEscape(s);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
