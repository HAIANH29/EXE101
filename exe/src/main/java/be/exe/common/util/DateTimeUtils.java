package be.exe.common.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Tiện ích xử lý ngày giờ, cố định theo timezone Việt Nam.
 */
public final class DateTimeUtils {

    public static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final DateTimeFormatter DISPLAY_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private DateTimeUtils() {
        // utility class, không cho khởi tạo instance
    }

    public static LocalDateTime nowInVietnam() {
        return ZonedDateTime.now(VN_ZONE).toLocalDateTime();
    }

    public static String format(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DISPLAY_FORMAT);
    }

    /**
     * Kiểm tra 2 khoảng thời gian [start1, end1) và [start2, end2) có bị trùng (overlap) không.
     * Dùng khi cần validate double-booking ở tầng application trước khi insert
     * (bổ sung cho exclusion constraint ở tầng DB, giúp trả lỗi rõ ràng hơn cho client
     * thay vì để lộ lỗi constraint thô từ Postgres).
     */
    public static boolean isOverlapping(LocalDateTime start1, LocalDateTime end1,
                                         LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}
