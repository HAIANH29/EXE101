package be.exe.salon.service;

import be.exe.salon.dto.request.CreateStylistRequest;
import be.exe.salon.dto.request.UpdateStylistRequest;
import be.exe.salon.dto.response.StylistResponse;
import be.exe.salon.dto.response.StylistSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * "Public API" của phần Stylist trong module salon.
 */
public interface StylistService {

    /**
     * Dùng bởi module khác (booking). Ném ResourceNotFoundException nếu không tồn tại.
     */
    StylistSummaryResponse getStylistOrThrow(Long stylistId);

    StylistResponse createStylist(Long salonId, Long ownerId, CreateStylistRequest request);

    StylistResponse updateStylist(Long stylistId, Long ownerId, UpdateStylistRequest request);

    StylistResponse getStylist(Long stylistId);

    Page<StylistResponse> getStylistsBySalon(Long salonId, Pageable pageable);
}
