package be.exe.publicapi.dto;

import be.exe.catalog.dto.response.HairstyleResponse;
import be.exe.catalog.dto.response.ServiceResponse;
import be.exe.review.dto.response.SalonRatingSummaryResponse;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.dto.response.StylistResponse;

import java.util.List;

/**
 * Một salon kèm đủ dữ liệu cho màn danh sách (dịch vụ, stylist, kiểu tóc, giờ mở cửa, đánh giá),
 * để app không phải gọi ~5 request riêng cho từng salon. Các trường con giữ nguyên hình dạng
 * của các endpoint lẻ tương ứng. Mục nào lỗi/không có sẽ là null hoặc danh sách rỗng.
 */
public record SalonDirectoryEntry(
        SalonResponse salon,
        SalonDetailResponse detail,
        List<ServiceResponse> services,
        List<StylistResponse> stylists,
        List<HairstyleResponse> hairstyles,
        SalonRatingSummaryResponse reviewSummary) {
}
