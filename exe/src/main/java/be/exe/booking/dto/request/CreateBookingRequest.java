package be.exe.booking.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class CreateBookingRequest {

    @NotNull(message = "salonId không được để trống")
    private Long salonId;

    @NotNull(message = "stylistId không được để trống")
    private Long stylistId;

    @NotNull(message = "serviceId không được để trống")
    private Long serviceId;

    /**
     * Optional - chỉ có khi khách chọn kiểu tóc cụ thể (thường đi kèm từ tính năng thử tóc AI).
     */
    private Long hairstyleId;

    @NotNull(message = "Thời gian đặt lịch không được để trống")
    @Future(message = "Thời gian đặt lịch phải ở tương lai")
    private Instant startAt;

    private String note;

    public Long getSalonId() {
        return salonId;
    }

    public void setSalonId(Long salonId) {
        this.salonId = salonId;
    }

    public Long getStylistId() {
        return stylistId;
    }

    public void setStylistId(Long stylistId) {
        this.stylistId = stylistId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public Long getHairstyleId() {
        return hairstyleId;
    }

    public void setHairstyleId(Long hairstyleId) {
        this.hairstyleId = hairstyleId;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public void setStartAt(Instant startAt) {
        this.startAt = startAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
