package be.exe.publicapi;

import be.exe.catalog.service.HairstyleService;
import be.exe.catalog.service.ServiceCatalogService;
import be.exe.common.response.ApiResponse;
import be.exe.common.util.PaginationUtils;
import be.exe.publicapi.dto.SalonDirectoryEntry;
import be.exe.review.service.ReviewService;
import be.exe.salon.domain.SalonStatus;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.service.SalonService;
import be.exe.salon.service.StylistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.function.Supplier;

/**
 * Danh sách salon ACTIVE kèm dịch vụ / stylist / kiểu tóc / giờ mở cửa / đánh giá trong MỘT request.
 * Thay cho việc client phải gọi N x 5 endpoint lẻ. Chỉ đi qua các service interface của từng module.
 */
@RestController
@RequestMapping("/api/public/salons")
public class SalonDirectoryController {

    private static final Logger log = LoggerFactory.getLogger(SalonDirectoryController.class);
    private static final int MAX_SALONS = 100;

    private final SalonService salonService;
    private final ServiceCatalogService serviceCatalogService;
    private final StylistService stylistService;
    private final HairstyleService hairstyleService;
    private final ReviewService reviewService;

    public SalonDirectoryController(SalonService salonService,
                                    ServiceCatalogService serviceCatalogService,
                                    StylistService stylistService,
                                    HairstyleService hairstyleService,
                                    ReviewService reviewService) {
        this.salonService = salonService;
        this.serviceCatalogService = serviceCatalogService;
        this.stylistService = stylistService;
        this.hairstyleService = hairstyleService;
        this.reviewService = reviewService;
    }

    @GetMapping("/directory")
    public ApiResponse<List<SalonDirectoryEntry>> directory() {
        var pageable = PaginationUtils.of(0, MAX_SALONS);
        List<SalonResponse> salons = salonService.getSalons(SalonStatus.ACTIVE, pageable).getContent();

        List<SalonDirectoryEntry> entries = salons.stream()
                .map(salon -> new SalonDirectoryEntry(
                        salon,
                        safe(() -> salonService.getSalonDetail(salon.id()), null),
                        safe(() -> serviceCatalogService.getServicesBySalon(salon.id(), pageable).getContent(), List.of()),
                        safe(() -> stylistService.getStylistsBySalon(salon.id(), pageable).getContent(), List.of()),
                        safe(() -> hairstyleService.getHairstylesBySalon(salon.id()), List.of()),
                        safe(() -> reviewService.getSalonRatingSummary(salon.id()), null)))
                .toList();
        return ApiResponse.success(entries);
    }

    /** Một salon lỗi một phần dữ liệu thì chỉ bỏ phần đó, không làm hỏng cả danh sách. */
    private static <T> T safe(Supplier<T> supplier, T fallback) {
        try {
            return supplier.get();
        } catch (RuntimeException ex) {
            log.warn("Salon directory: skipped a section: {}", ex.toString());
            return fallback;
        }
    }
}
