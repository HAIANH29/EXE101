package be.exe.salon.service;

import be.exe.salon.dto.request.CreateSalonRequest;
import be.exe.salon.dto.request.UpdateSalonRequest;
import be.exe.salon.dto.response.SalonDetailResponse;
import be.exe.salon.dto.response.SalonResponse;
import be.exe.salon.dto.response.SalonSummaryResponse;
import be.exe.salon.dto.request.UpdateBusinessHourRequest;
import be.exe.salon.dto.response.BusinessHourResponse;
import be.exe.salon.domain.SalonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.time.DayOfWeek;

/**
 * "Public API" của module salon - các module khác (booking, review...) chỉ được gọi qua đây,
 * KHÔNG được import thẳng SalonRepository hay Salon entity.
 */
public interface SalonService {

    /**
     * Dùng bởi module khác (booking) - chỉ trả về dữ liệu tối thiểu.
     * Ném ResourceNotFoundException nếu không tồn tại.
     */
    SalonSummaryResponse getSalonOrThrow(Long salonId);

    SalonResponse createSalon(Long ownerId, CreateSalonRequest request);

    SalonResponse updateSalon(Long salonId, Long ownerId, UpdateSalonRequest request);

    SalonResponse updateSalonStatus(Long salonId, SalonStatus status);

    SalonDetailResponse getSalonDetail(Long salonId);

    Page<SalonResponse> getSalons(SalonStatus statusFilter, Pageable pageable);

    Page<SalonResponse> getSalonsByOwner(Long ownerId, Pageable pageable);

    void updateBusinessHours(Long salonId, Long ownerId, List<UpdateBusinessHourRequest> requests);

    BusinessHourResponse getBusinessHour(Long salonId, DayOfWeek dayOfWeek);

    /** Dùng cho dashboard (module admin): đếm số salon theo trạng thái. */
    long countSalonsByStatus(SalonStatus status);

    long countAllSalons();
}
