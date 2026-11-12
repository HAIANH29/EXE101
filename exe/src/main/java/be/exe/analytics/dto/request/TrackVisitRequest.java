package be.exe.analytics.dto.request;

/** Payload client gửi khi người dùng vào web (mọi field đều tuỳ chọn, server sẽ chuẩn hoá). */
public record TrackVisitRequest(
        String sessionId,
        String utmSource,
        String utmMedium,
        String utmCampaign,
        String utmTerm,
        String utmContent,
        String landingPath,
        String referrer
) {
}
