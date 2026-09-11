package be.exe.catalog.service;

import be.exe.catalog.dto.request.CreateHairstyleRequest;
import be.exe.catalog.dto.request.UpdateHairstyleRequest;
import be.exe.catalog.dto.response.HairstyleResponse;
import be.exe.catalog.dto.response.HairstyleSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface HairstyleService {

    /**
     * Dùng bởi module khác (booking, tryon). Ném ResourceNotFoundException nếu không tồn tại.
     */
    HairstyleSummaryResponse getHairstyleOrThrow(Long hairstyleId);

    HairstyleResponse createHairstyle(CreateHairstyleRequest request);

    HairstyleResponse updateHairstyle(Long hairstyleId, UpdateHairstyleRequest request);

    HairstyleResponse getHairstyle(Long hairstyleId);

    Page<HairstyleResponse> getHairstyles(Long categoryId, Pageable pageable);

    /**
     * Chủ salon gán 1 kiểu tóc (đã có trong danh mục chung) vào salon của mình,
     * nghĩa là salon đó có cung cấp dịch vụ làm kiểu tóc này.
     */
    void assignToSalon(Long salonId, Long hairstyleId, Long ownerId);

    void unassignFromSalon(Long salonId, Long hairstyleId, Long ownerId);

    List<HairstyleResponse> getHairstylesBySalon(Long salonId);
}
