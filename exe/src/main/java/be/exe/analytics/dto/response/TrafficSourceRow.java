package be.exe.analytics.dto.response;

/** Một dòng thống kê: nguồn (+ medium/campaign nếu có) với số lượt truy cập và số phiên khác nhau. */
public record TrafficSourceRow(
        String source,
        String medium,
        String campaign,
        long visits,
        long sessions
) {
}
